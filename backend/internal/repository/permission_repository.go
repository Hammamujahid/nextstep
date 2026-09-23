package repository

import (
	"context"
	"errors"

	"backend/internal/apperrors"
	"backend/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PermissionRepository membaca role dan hak akses per resource milik user di sebuah workspace.
// Aturan: admin selalu full akses; member mengikuti workspace_member_permissions
// (none | viewer | editor). Tanpa baris permission, member dianggap viewer.
type PermissionRepository struct {
	db *pgxpool.Pool
}

func NewPermissionRepository(db *pgxpool.Pool) *PermissionRepository {
	return &PermissionRepository{db: db}
}

// GetMemberPermission mengembalikan (member_role, permission) untuk satu resource.
func (r *PermissionRepository) GetMemberPermission(
	ctx context.Context,
	workspaceID int,
	userID int,
	resource string,
) (string, string, error) {
	var role string
	var perm *string
	err := r.db.QueryRow(
		ctx,
		`SELECT m.member_role, p.permission
		 FROM workspace_members m
		 LEFT JOIN workspace_member_permissions p
		   ON p.workspace_member_id = m.id AND p.resource_type = $3
		 WHERE m.workspace_id = $1 AND m.user_id = $2`,
		workspaceID,
		userID,
		resource,
	).Scan(&role, &perm)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", "", apperrors.ErrNotMember
		}
		return "", "", apperrors.ErrDatabase
	}
	if role == "admin" {
		return role, "editor", nil
	}
	if perm == nil || *perm == "" {
		return role, "viewer", nil
	}
	return role, *perm, nil
}

// ListAssignableMembers mengembalikan anggota workspace yang boleh di-assign
// ke sebuah resource: permission-nya selain none (admin selalu editor).
func (r *PermissionRepository) ListAssignableMembers(
	ctx context.Context,
	workspaceID int,
	resource string,
) ([]model.AssignableMember, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			m.user_id,
			u.username,
			u.email,
			m.member_role,
			CASE WHEN m.member_role = 'admin' THEN 'editor' ELSE COALESCE(p.permission, 'viewer') END AS permission
		FROM workspace_members m
		INNER JOIN users u ON u.id = m.user_id
		LEFT JOIN workspace_member_permissions p
			ON p.workspace_member_id = m.id AND p.resource_type = $2
		WHERE m.workspace_id = $1
			AND (m.member_role = 'admin' OR COALESCE(p.permission, 'viewer') != 'none')
		ORDER BY u.username ASC
	`, workspaceID, resource)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()

	members := []model.AssignableMember{}
	for rows.Next() {
		var m model.AssignableMember
		if err := rows.Scan(&m.UserID, &m.Username, &m.Email, &m.MemberRole, &m.Permission); err != nil {
			return nil, apperrors.ErrDatabase
		}
		members = append(members, m)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return members, nil
}

// UpsertMemberPermission menyimpan permission satu resource milik satu anggota.
// Baris permission admin diabaikan saat baca (admin selalu editor), tapi tetap boleh ditulis.
func (r *PermissionRepository) UpsertMemberPermission(
	ctx context.Context,
	memberID int,
	resource string,
	permission string,
) error {
	_, err := r.db.Exec(
		ctx,
		`INSERT INTO workspace_member_permissions (workspace_member_id, resource_type, permission)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (workspace_member_id, resource_type)
		 DO UPDATE SET permission = EXCLUDED.permission`,
		memberID,
		resource,
		permission,
	)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
}

// GetAllPermissions mengembalikan role plus permission keempat resource sekaligus.
func (r *PermissionRepository) GetAllPermissions(
	ctx context.Context,
	workspaceID int,
	userID int,
) (string, map[string]string, error) {
	perms := map[string]string{}
	var role string
	for _, resource := range []string{"project", "task", "goal", "job_application"} {
		ro, pe, err := r.GetMemberPermission(ctx, workspaceID, userID, resource)
		if err != nil {
			return "", nil, err
		}
		role = ro
		perms[resource] = pe
	}
	return role, perms, nil
}
