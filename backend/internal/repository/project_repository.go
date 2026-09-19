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
		SELECT
			p.id, p.workspace_id, p.project_name, p.project_description, p.status,
			p.created_at, p.updated_at,
			COALESCE(t.total, 0)::int AS total_tasks,
			COALESCE(t.completed, 0)::int AS completed_tasks
		FROM projects p
		LEFT JOIN (
			SELECT
				project_id,
				COUNT(*)::int AS total,
				COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
			FROM tasks
			WHERE project_id IS NOT NULL
			GROUP BY project_id
		) t ON t.project_id = p.id
		WHERE p.workspace_id = $1
		ORDER BY p.created_at ASC
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
			&p.TotalTasks,
			&p.CompletedTasks,
		); err != nil {
			return nil, apperrors.ErrDatabase
		}
		if p.TotalTasks > 0 {
			p.Progress = (p.CompletedTasks * 100) / p.TotalTasks
		}
		projects = append(projects, &p)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return projects, nil
}

func (r *ProjectRepository) FindByIDAndWorkspace(
	ctx context.Context,
	id int,
	workspaceID int,
) (*model.Project, error) {
	var p model.Project
	err := r.db.QueryRow(ctx, `
		SELECT
			p.id, p.workspace_id, p.project_name, p.project_description, p.status,
			p.created_at, p.updated_at,
			COALESCE(t.total, 0)::int AS total_tasks,
			COALESCE(t.completed, 0)::int AS completed_tasks
		FROM projects p
		LEFT JOIN (
			SELECT
				project_id,
				COUNT(*)::int AS total,
				COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
			FROM tasks
			WHERE project_id IS NOT NULL
			GROUP BY project_id
		) t ON t.project_id = p.id
		WHERE p.id = $1 AND p.workspace_id = $2`, id, workspaceID,
	).Scan(&p.ID, &p.WorkspaceId, &p.ProjectName, &p.ProjectDescription, &p.Status, &p.CreatedAt, &p.UpdatedAt, &p.TotalTasks, &p.CompletedTasks)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	if p.TotalTasks > 0 {
		p.Progress = (p.CompletedTasks * 100) / p.TotalTasks
	}
	return &p, nil
}

func (r *ProjectRepository) attachTaskProgress(
	ctx context.Context,
	p *model.Project,
) {
	var total, completed int
	err := r.db.QueryRow(ctx, `
		SELECT
			COUNT(*)::int AS total,
			COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
		FROM tasks
		WHERE project_id = $1
	`, p.ID).Scan(&total, &completed)
	if err != nil {
		return
	}
	p.TotalTasks = total
	p.CompletedTasks = completed
	if total > 0 {
		p.Progress = (completed * 100) / total
	}
}

func (r *ProjectRepository) UpdateStatus(
	ctx context.Context,
	projectID int,
	status string,
) error {
	_, err := r.db.Exec(ctx, `UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2`, status, projectID)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
}

// RecalculateStatusFromTasks menerapkan aturan:
// - tidak ada tasks -> status tidak berubah (tidak ada bar)
// - 1..n-1 completed -> in_progress
// - semua completed -> status TIDAK diubah (bar 100% saja)
func (r *ProjectRepository) RecalculateStatusFromTasks(
	ctx context.Context,
	projectID int,
	workspaceID int,
) (string, error) {
	var total, completed int
	var current string
	err := r.db.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*)::int FROM tasks WHERE project_id = $1) AS total,
			(SELECT COUNT(*)::int FROM tasks WHERE project_id = $1 AND status = 'completed') AS completed,
			(SELECT status FROM projects WHERE id = $1 AND workspace_id = $2) AS current_status
	`, projectID, workspaceID).Scan(&total, &completed, &current)
	if err != nil {
		return "", apperrors.ErrDatabase
	}
	var newStatus string
	if total == 0 {
		newStatus = current
	} else if completed == 0 {
		newStatus = "not_started"
	} else if completed > 0 && completed < total {
		newStatus = "in_progress"
	} else {
		// semua completed -> status tidak diubah, cukup bar 100%
		newStatus = current
	}
	if newStatus != current {
		if err := r.UpdateStatus(ctx, projectID, newStatus); err != nil {
			return "", err
		}
		return newStatus, nil
	}
	return current, nil
}

func (r *ProjectRepository) Create(
	ctx context.Context,
	project *model.Project,
) (*model.Project, error) {
	if project.Status == "" {
		project.Status = "not_started"
	}
	query := `
		INSERT INTO projects (workspace_id, project_name, project_description, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id, workspace_id, project_name, project_description, status, created_at, updated_at
	`
	var created model.Project
	err := r.db.QueryRow(ctx, query,
		project.WorkspaceId,
		project.ProjectName,
		project.ProjectDescription,
		project.Status,
	).Scan(&created.ID, &created.WorkspaceId, &created.ProjectName, &created.ProjectDescription, &created.Status, &created.CreatedAt, &created.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &created, nil
}

func (r *ProjectRepository) Update(
	ctx context.Context,
	workspaceID int,
	projectID int,
	req model.UpdateProjectRequest,
) (*model.Project, error) {
	query := `
		UPDATE projects SET
			project_name = COALESCE($1, project_name),
			project_description = COALESCE($2, project_description),
			status = COALESCE($3, status),
			updated_at = NOW()
		WHERE id = $4 AND workspace_id = $5
		RETURNING id, workspace_id, project_name, project_description, status, created_at, updated_at
	`
	var updated model.Project
	err := r.db.QueryRow(ctx, query,
		req.ProjectName,
		req.ProjectDescription,
		req.Status,
		projectID,
		workspaceID,
	).Scan(&updated.ID, &updated.WorkspaceId, &updated.ProjectName, &updated.ProjectDescription, &updated.Status, &updated.CreatedAt, &updated.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	r.attachTaskProgress(ctx, &updated)
	return &updated, nil
}

func (r *ProjectRepository) Delete(
	ctx context.Context,
	workspaceID int,
	projectID int,
) error {
	res, err := r.db.Exec(ctx, `DELETE FROM projects WHERE id = $1 AND workspace_id = $2`, projectID, workspaceID)
	if err != nil {
		return apperrors.ErrDatabase
	}
	if res.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
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
