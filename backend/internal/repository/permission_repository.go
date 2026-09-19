package repository

import (
	"context"
	"errors"

	"backend/internal/apperrors"

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
