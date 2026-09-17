package repository

import (
	"context"

	"backend/internal/apperrors"
	"backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TaskRepository struct {
	db *pgxpool.Pool
}

func NewTaskRepository(db *pgxpool.Pool) *TaskRepository {
	return &TaskRepository{db: db}
}

func (r *TaskRepository) ListByWorkspace(
	ctx context.Context,
	workspaceID int,
) ([]*model.Task, error) {
	query := `
		SELECT id, workspace_id, project_id, title, description, priority, status, due_date, estimated_minutes, created_at, updated_at
		FROM tasks
		WHERE workspace_id = $1
		ORDER BY
			CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
			due_date ASC NULLS LAST,
			updated_at DESC
	`
	rows, err := r.db.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()

	tasks := make([]*model.Task, 0)
	for rows.Next() {
		var t model.Task
		if err := rows.Scan(
			&t.ID,
			&t.WorkspaceId,
			&t.ProjectId,
			&t.Title,
			&t.Description,
			&t.Priority,
			&t.Status,
			&t.DueDate,
			&t.EstimatedMinutes,
			&t.CreatedAt,
			&t.UpdatedAt,
		); err != nil {
			return nil, apperrors.ErrDatabase
		}
		tasks = append(tasks, &t)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return tasks, nil
}

func (r *TaskRepository) FindByID(
	ctx context.Context,
	id int,
) (*model.Task, error) {
	var t model.Task
	err := r.db.QueryRow(ctx,
		`SELECT id, workspace_id, project_id, title, description, priority, status, due_date, estimated_minutes, created_at, updated_at FROM tasks WHERE id = $1`, id,
	).Scan(&t.ID, &t.WorkspaceId, &t.ProjectId, &t.Title, &t.Description, &t.Priority, &t.Status, &t.DueDate, &t.EstimatedMinutes, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &t, nil
}

func (r *TaskRepository) FindByIDAndWorkspace(
	ctx context.Context,
	id int,
	workspaceID int,
) (*model.Task, error) {
	var t model.Task
	err := r.db.QueryRow(ctx,
		`SELECT id, workspace_id, project_id, title, description, priority, status, due_date, estimated_minutes, created_at, updated_at FROM tasks WHERE id = $1 AND workspace_id = $2`, id, workspaceID,
	).Scan(&t.ID, &t.WorkspaceId, &t.ProjectId, &t.Title, &t.Description, &t.Priority, &t.Status, &t.DueDate, &t.EstimatedMinutes, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &t, nil
}

func (r *TaskRepository) Create(
	ctx context.Context,
	task *model.Task,
) (*model.Task, error) {
	if task.Status == "" {
		task.Status = "not_started"
	}
	if task.Priority == "" {
		task.Priority = "medium"
	}
	if task.EstimatedMinutes <= 0 {
		task.EstimatedMinutes = 30
	}
	query := `
		INSERT INTO tasks (workspace_id, project_id, title, description, priority, status, due_date, estimated_minutes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, workspace_id, project_id, title, description, priority, status, due_date, estimated_minutes, created_at, updated_at
	`
	var created model.Task
	err := r.db.QueryRow(ctx, query,
		task.WorkspaceId,
		task.ProjectId,
		task.Title,
		task.Description,
		task.Priority,
		task.Status,
		task.DueDate,
		task.EstimatedMinutes,
	).Scan(&created.ID, &created.WorkspaceId, &created.ProjectId, &created.Title, &created.Description, &created.Priority, &created.Status, &created.DueDate, &created.EstimatedMinutes, &created.CreatedAt, &created.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &created, nil
}

func (r *TaskRepository) Update(
	ctx context.Context,
	workspaceID int,
	taskID int,
	req model.UpdateTaskRequest,
) (*model.Task, error) {
	clearDue := req.ClearDueDate != nil && *req.ClearDueDate
	query := `
		UPDATE tasks SET
			title = COALESCE($1, title),
			description = COALESCE($2, description),
			priority = COALESCE($3, priority),
			status = COALESCE($4, status),
			due_date = CASE WHEN $7 THEN NULL ELSE COALESCE($5, due_date) END,
			project_id = COALESCE($6, project_id),
			estimated_minutes = COALESCE($10, estimated_minutes),
			updated_at = NOW()
		WHERE id = $8 AND workspace_id = $9
		RETURNING id, workspace_id, project_id, title, description, priority, status, due_date, estimated_minutes, created_at, updated_at
	`
	var updated model.Task
	err := r.db.QueryRow(ctx, query,
		req.Title,
		req.Description,
		req.Priority,
		req.Status,
		req.DueDate,
		req.ProjectId,
		clearDue,
		taskID,
		workspaceID,
		req.EstimatedMinutes,
	).Scan(&updated.ID, &updated.WorkspaceId, &updated.ProjectId, &updated.Title, &updated.Description, &updated.Priority, &updated.Status, &updated.DueDate, &updated.EstimatedMinutes, &updated.CreatedAt, &updated.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &updated, nil
}

func (r *TaskRepository) ToggleComplete(
	ctx context.Context,
	workspaceID int,
	taskID int,
) (*model.Task, error) {
	query := `
		UPDATE tasks SET
			status = CASE WHEN status = 'completed' THEN 'not_started' ELSE 'completed' END,
			updated_at = NOW()
		WHERE id = $1 AND workspace_id = $2
		RETURNING id, workspace_id, project_id, title, description, priority, status, due_date, estimated_minutes, created_at, updated_at
	`
	var updated model.Task
	err := r.db.QueryRow(ctx, query, taskID, workspaceID).Scan(&updated.ID, &updated.WorkspaceId, &updated.ProjectId, &updated.Title, &updated.Description, &updated.Priority, &updated.Status, &updated.DueDate, &updated.EstimatedMinutes, &updated.CreatedAt, &updated.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &updated, nil
}

func (r *TaskRepository) GetStats(
	ctx context.Context,
	workspaceID int,
) (*model.TaskStats, error) {
	query := `
		SELECT
			COUNT(*)::int AS total,
			COUNT(*) FILTER (WHERE status = 'not_started')::int AS not_started,
			COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
			COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
			COUNT(*) FILTER (WHERE priority = 'high' AND status != 'completed')::int AS high_priority,
			COUNT(*) FILTER (WHERE priority = 'medium' AND status != 'completed')::int AS medium_priority,
			COUNT(*) FILTER (WHERE priority = 'low' AND status != 'completed')::int AS low_priority
		FROM tasks
		WHERE workspace_id = $1
	`
	var s model.TaskStats
	if err := r.db.QueryRow(ctx, query, workspaceID).Scan(&s.Total, &s.NotStarted, &s.InProgress, &s.Completed, &s.HighPriority, &s.MediumPriority, &s.LowPriority); err != nil {
		return nil, apperrors.ErrDatabase
	}
	s.Pending = s.NotStarted + s.InProgress
	s.Archived = 0
	return &s, nil
}
