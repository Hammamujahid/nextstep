package repository

import (
	"context"
	"errors"

	"backend/internal/apperrors"
	"backend/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WorkspaceRepository struct {
	db *pgxpool.Pool
}

func NewWorkspaceRepository(db *pgxpool.Pool) *WorkspaceRepository {
	return &WorkspaceRepository{
		db: db,
	}
}

// CreateWithAdminMember membuat workspace baru dan langsung
// mendaftarkan pembuatnya sebagai anggota dengan role admin.
func (r *WorkspaceRepository) CreateWithAdminMember(
	ctx context.Context,
	workspace *model.Workspace,
	userID int,
) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return apperrors.ErrDatabase
	}
	defer tx.Rollback(ctx)

	err = tx.QueryRow(
		ctx,
		`INSERT INTO workspaces (name, description)
		 VALUES ($1, $2)
		 RETURNING id, created_at, updated_at`,
		workspace.Name,
		workspace.Description,
	).Scan(
		&workspace.ID,
		&workspace.CreatedAt,
		&workspace.UpdatedAt,
	)
	if err != nil {
		return apperrors.ErrDatabase
	}

	_, err = tx.Exec(
		ctx,
		`INSERT INTO workspace_members (workspace_id, user_id, member_role)
		 VALUES ($1, $2, 'admin')`,
		workspace.ID,
		userID,
	)
	if err != nil {
		return apperrors.ErrDatabase
	}

	if err := tx.Commit(ctx); err != nil {
		return apperrors.ErrDatabase
	}

	return nil
}

// ListByUserID mengembalikan semua workspace yang diikuti user
// beserta role keanggotaannya.
func (r *WorkspaceRepository) ListByUserID(
	ctx context.Context,
	userID int,
) ([]model.WorkspaceWithRole, error) {
	query := `
		SELECT
			w.id,
			w.name,
			w.description,
			w.created_at,
			w.updated_at,
			m.member_role
		FROM workspaces w
		INNER JOIN workspace_members m ON m.workspace_id = w.id
		WHERE m.user_id = $1
		ORDER BY w.created_at ASC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()

	workspaces := []model.WorkspaceWithRole{}
	for rows.Next() {
		var ws model.WorkspaceWithRole
		if err := rows.Scan(
			&ws.ID,
			&ws.Name,
			&ws.Description,
			&ws.CreatedAt,
			&ws.UpdatedAt,
			&ws.MemberRole,
		); err != nil {
			return nil, apperrors.ErrDatabase
		}
		workspaces = append(workspaces, ws)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}

	return workspaces, nil
}

// Update mengubah nama dan deskripsi workspace,
// mengembalikan data terbaru.
func (r *WorkspaceRepository) Update(
	ctx context.Context,
	workspaceID int,
	name string,
	description *string,
) (*model.Workspace, error) {
	workspace := &model.Workspace{}
	err := r.db.QueryRow(
		ctx,
		`UPDATE workspaces
		 SET name = $2, description = $3, updated_at = NOW()
		 WHERE id = $1
		 RETURNING id, name, description, created_at, updated_at`,
		workspaceID,
		name,
		description,
	).Scan(
		&workspace.ID,
		&workspace.Name,
		&workspace.Description,
		&workspace.CreatedAt,
		&workspace.UpdatedAt,
	)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return workspace, nil
}

// GetRole mengembalikan role user di workspace,
// atau ErrNotMember kalau user bukan anggota.
func (r *WorkspaceRepository) GetRole(
	ctx context.Context,
	workspaceID int,
	userID int,
) (string, error) {
	var role string
	err := r.db.QueryRow(
		ctx,
		`SELECT member_role FROM workspace_members
		 WHERE workspace_id = $1 AND user_id = $2`,
		workspaceID,
		userID,
	).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", apperrors.ErrNotMember
		}
		return "", apperrors.ErrDatabase
	}
	return role, nil
}

// ListMembers mengembalikan semua anggota workspace
// beserta username dan email mereka.
func (r *WorkspaceRepository) ListMembers(
	ctx context.Context,
	workspaceID int,
) ([]model.WorkspaceMemberWithUser, error) {
	query := `
		SELECT
			m.id,
			m.user_id,
			u.username,
			u.email,
			m.member_role,
			m.created_at
		FROM workspace_members m
		INNER JOIN users u ON u.id = m.user_id
		WHERE m.workspace_id = $1
		ORDER BY m.created_at ASC
	`

	rows, err := r.db.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()

	members := []model.WorkspaceMemberWithUser{}
	for rows.Next() {
		var m model.WorkspaceMemberWithUser
		if err := rows.Scan(
			&m.ID,
			&m.UserID,
			&m.Username,
			&m.Email,
			&m.MemberRole,
			&m.CreatedAt,
		); err != nil {
			return nil, apperrors.ErrDatabase
		}
		members = append(members, m)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}

	return members, nil
}

// CreateInvitation mencatat undangan email baru berstatus pending.
func (r *WorkspaceRepository) CreateInvitation(
	ctx context.Context,
	invitation *model.WorkspaceInvitation,
) error {
	err := r.db.QueryRow(
		ctx,
		`INSERT INTO workspace_invitations (workspace_id, email, status)
		 VALUES ($1, $2, 'pending')
		 RETURNING id, created_at, updated_at`,
		invitation.WorkspaceId,
		invitation.Email,
	).Scan(
		&invitation.ID,
		&invitation.CreatedAt,
		&invitation.UpdatedAt,
	)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
}

// ListInvitations mengembalikan undangan yang masih pending.
func (r *WorkspaceRepository) ListInvitations(
	ctx context.Context,
	workspaceID int,
) ([]model.WorkspaceInvitation, error) {
	query := `
		SELECT id, workspace_id, email, status, created_at, updated_at
		FROM workspace_invitations
		WHERE workspace_id = $1 AND status = 'pending'
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()

	invitations := []model.WorkspaceInvitation{}
	for rows.Next() {
		var inv model.WorkspaceInvitation
		if err := rows.Scan(
			&inv.ID,
			&inv.WorkspaceId,
			&inv.Email,
			&inv.Status,
			&inv.CreatedAt,
			&inv.UpdatedAt,
		); err != nil {
			return nil, apperrors.ErrDatabase
		}
		invitations = append(invitations, inv)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}

	return invitations, nil
}

// FindPendingInvitation mencari undangan pending untuk email tersebut.
func (r *WorkspaceRepository) FindPendingInvitation(
	ctx context.Context,
	workspaceID int,
	email string,
) (*model.WorkspaceInvitation, error) {
	var inv model.WorkspaceInvitation
	err := r.db.QueryRow(
		ctx,
		`SELECT id, workspace_id, email, status, created_at, updated_at
		 FROM workspace_invitations
		 WHERE workspace_id = $1 AND email = $2 AND status = 'pending'`,
		workspaceID,
		email,
	).Scan(
		&inv.ID,
		&inv.WorkspaceId,
		&inv.Email,
		&inv.Status,
		&inv.CreatedAt,
		&inv.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, apperrors.ErrDatabase
	}
	return &inv, nil
}

// IsUserMember mengecek apakah email sudah menjadi anggota workspace.
func (r *WorkspaceRepository) IsUserMember(
	ctx context.Context,
	workspaceID int,
	email string,
) (bool, error) {
	var exists bool
	err := r.db.QueryRow(
		ctx,
		`SELECT EXISTS(
			SELECT 1 FROM workspace_members m
			INNER JOIN users u ON u.id = m.user_id
			WHERE m.workspace_id = $1 AND u.email = $2
		)`,
		workspaceID,
		email,
	).Scan(&exists)
	if err != nil {
		return false, apperrors.ErrDatabase
	}
	return exists, nil
}
