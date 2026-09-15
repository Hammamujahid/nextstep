package repository

import (
	"context"

	"backend/internal/apperrors"
	"backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ProjectRepository struct {
	db *pgxpool.Pool
}

func NewProjectRepository(db *pgxpool.Pool) *ProjectRepository {
	return &ProjectRepository{db: db}
}

func (r *ProjectRepository) ListByWorkspace(
	ctx context.Context,
	workspaceID int,
) ([]*model.Project, error) {
	query := `
		SELECT id, workspace_id, project_name, project_description, status, created_at, updated_at
		FROM projects
		WHERE workspace_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()

	projects := make([]*model.Project, 0)
	for rows.Next() {
		var p model.Project
		if err := rows.Scan(
			&p.ID,
			&p.WorkspaceId,
			&p.ProjectName,
			&p.ProjectDescription,
			&p.Status,
			&p.CreatedAt,
			&p.UpdatedAt,
		); err != nil {
			return nil, apperrors.ErrDatabase
		}
		projects = append(projects, &p)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return projects, nil
}

func (r *ProjectRepository) FindByID(
	ctx context.Context,
	id int,
) (*model.Project, error) {
	var p model.Project
	err := r.db.QueryRow(ctx,
		`SELECT id, workspace_id, project_name, project_description, status, created_at, updated_at FROM projects WHERE id = $1`, id,
	).Scan(&p.ID, &p.WorkspaceId, &p.ProjectName, &p.ProjectDescription, &p.Status, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &p, nil
}

func (r *ProjectRepository) GetStats(
	ctx context.Context,
	workspaceID int,
) (*model.ProjectStats, error) {
	query := `
		SELECT
			COUNT(*)::int AS total,
			COUNT(*) FILTER (WHERE status = 'not_started')::int AS not_started,
			COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
			COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
			COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
		FROM projects
		WHERE workspace_id = $1
	`
	var s model.ProjectStats
	if err := r.db.QueryRow(ctx, query, workspaceID).Scan(&s.Total, &s.NotStarted, &s.InProgress, &s.Completed, &s.Archived); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &s, nil
}
