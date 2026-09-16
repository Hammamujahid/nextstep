package repository

import (
	"context"

	"backend/internal/apperrors"
	"backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type GoalRepository struct {
	db *pgxpool.Pool
}

func NewGoalRepository(db *pgxpool.Pool) *GoalRepository {
	return &GoalRepository{db: db}
}

// GetGoalsWithProgress mengembalikan semua goal dalam workspace beserta
// agregasi project/task untuk perhitungan progress. Ini adalah data
// mentah domain Goal; pemilihan primary goal dilakukan di service.
func (r *GoalRepository) GetGoalsWithProgress(
	ctx context.Context,
	workspaceID int,
) ([]*model.PrimaryGoal, error) {
	query := `
		SELECT
			g.id,
			g.workspace_id,
			g.title,
			g.description,
			g.status,
			g.created_at,
			g.updated_at,
			COALESCE(p.total, 0) AS total_projects,
			COALESCE(p.completed, 0) AS completed_projects,
			COALESCE(t.total, 0) AS total_tasks,
			COALESCE(t.completed, 0) AS completed_tasks
		FROM goals g
		LEFT JOIN (
			SELECT
				gp.goal_id,
				COUNT(*)::int AS total,
				COUNT(*) FILTER (WHERE proj.status = 'completed')::int AS completed
			FROM goal_projects gp
			JOIN projects proj ON proj.id = gp.project_id
			GROUP BY gp.goal_id
		) p ON p.goal_id = g.id
		LEFT JOIN (
			SELECT
				gt.goal_id,
				COUNT(*)::int AS total,
				COUNT(*) FILTER (WHERE tk.status = 'completed')::int AS completed
			FROM goal_tasks gt
			JOIN tasks tk ON tk.id = gt.task_id
			GROUP BY gt.goal_id
		) t ON t.goal_id = g.id
		WHERE g.workspace_id = $1
		ORDER BY g.created_at ASC
	`

	rows, err := r.db.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()

	result := make([]*model.PrimaryGoal, 0)
	for rows.Next() {
		var g model.PrimaryGoal
		if err := rows.Scan(
			&g.ID,
			&g.WorkspaceId,
			&g.Title,
			&g.Description,
			&g.Status,
			&g.CreatedAt,
			&g.UpdatedAt,
			&g.TotalProjects,
			&g.CompletedProjects,
			&g.TotalTasks,
			&g.CompletedTasks,
		); err != nil {
			return nil, apperrors.ErrDatabase
		}
		g.TotalRequirements = g.TotalProjects + g.TotalTasks
		g.CompletedReqs = g.CompletedProjects + g.CompletedTasks
		if g.TotalRequirements > 0 {
			g.Progress = (g.CompletedReqs * 100) / g.TotalRequirements
		} else {
			if g.Status == "completed" {
				g.Progress = 100
			} else {
				g.Progress = 0
			}
		}
		result = append(result, &g)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}

	return result, nil
}

func (r *GoalRepository) GetStats(
	ctx context.Context,
	workspaceID int,
) (*model.GoalStats, error) {
	query := `
		SELECT
			COUNT(*)::int AS total,
			COUNT(*) FILTER (WHERE status = 'not_started')::int AS not_started,
			COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
			COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
			COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
		FROM goals
		WHERE workspace_id = $1
	`
	var s model.GoalStats
	if err := r.db.QueryRow(ctx, query, workspaceID).Scan(&s.Total, &s.NotStarted, &s.InProgress, &s.Completed, &s.Archived); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &s, nil
}

func (r *GoalRepository) ListTasksByGoal(
	ctx context.Context,
	goalID int,
	workspaceID int,
) ([]*model.Task, error) {
	query := `
		SELECT t.id, t.workspace_id, t.project_id, t.title, t.description, t.priority, t.status, t.due_date, t.created_at, t.updated_at
		FROM tasks t
		JOIN goal_tasks gt ON gt.task_id = t.id
		JOIN goals g ON g.id = gt.goal_id
		WHERE gt.goal_id = $1 AND g.workspace_id = $2
		ORDER BY
			CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC,
			t.due_date ASC NULLS LAST,
			t.updated_at DESC
	`
	rows, err := r.db.Query(ctx, query, goalID, workspaceID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()
	tasks := make([]*model.Task, 0)
	for rows.Next() {
		var t model.Task
		if err := rows.Scan(&t.ID, &t.WorkspaceId, &t.ProjectId, &t.Title, &t.Description, &t.Priority, &t.Status, &t.DueDate, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, apperrors.ErrDatabase
		}
		tasks = append(tasks, &t)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return tasks, nil
}

func (r *GoalRepository) ListProjectsByGoal(
	ctx context.Context,
	goalID int,
	workspaceID int,
) ([]*model.Project, error) {
	query := `
		SELECT p.id, p.workspace_id, p.project_name, p.project_description, p.status, p.created_at, p.updated_at
		FROM projects p
		JOIN goal_projects gp ON gp.project_id = p.id
		JOIN goals g ON g.id = gp.goal_id
		WHERE gp.goal_id = $1 AND g.workspace_id = $2
		ORDER BY p.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, goalID, workspaceID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()
	projects := make([]*model.Project, 0)
	for rows.Next() {
		var p model.Project
		if err := rows.Scan(&p.ID, &p.WorkspaceId, &p.ProjectName, &p.ProjectDescription, &p.Status, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, apperrors.ErrDatabase
		}
		projects = append(projects, &p)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return projects, nil
}

func (r *GoalRepository) FindByIDAndWorkspace(
	ctx context.Context,
	goalID int,
	workspaceID int,
) (*model.Goal, error) {
	var g model.Goal
	err := r.db.QueryRow(ctx, `SELECT id, workspace_id, title, description, status, created_at, updated_at FROM goals WHERE id = $1 AND workspace_id = $2`, goalID, workspaceID).Scan(&g.ID, &g.WorkspaceId, &g.Title, &g.Description, &g.Status, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &g, nil
}

func (r *GoalRepository) FindGoalIDsByTaskID(
	ctx context.Context,
	taskID int,
) ([]int, error) {
	rows, err := r.db.Query(ctx, `SELECT goal_id FROM goal_tasks WHERE task_id = $1`, taskID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()
	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return nil, apperrors.ErrDatabase
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return ids, nil
}

func (r *GoalRepository) Create(
	ctx context.Context,
	goal *model.Goal,
) (*model.Goal, error) {
	query := `INSERT INTO goals (workspace_id, title, description, status) VALUES ($1,$2,$3,$4) RETURNING id, workspace_id, title, description, status, created_at, updated_at`
	var created model.Goal
	err := r.db.QueryRow(ctx, query, goal.WorkspaceId, goal.Title, goal.Description, goal.Status).Scan(&created.ID, &created.WorkspaceId, &created.Title, &created.Description, &created.Status, &created.CreatedAt, &created.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &created, nil
}

func (r *GoalRepository) AddTaskToGoal(
	ctx context.Context,
	goalID int,
	taskID int,
) error {
	_, err := r.db.Exec(ctx, `INSERT INTO goal_tasks (goal_id, task_id) VALUES ($1,$2)`, goalID, taskID)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
}

func (r *GoalRepository) UpdateStatus(
	ctx context.Context,
	goalID int,
	status string,
) error {
	_, err := r.db.Exec(ctx, `UPDATE goals SET status = $1, updated_at = NOW() WHERE id = $2`, status, goalID)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
}

func (r *GoalRepository) RecalculateAndUpdateStatus(
	ctx context.Context,
	goalID int,
	workspaceID int,
) (string, error) {
	query := `
		SELECT
			COALESCE(p.total,0)+COALESCE(t.total,0) AS total,
			COALESCE(p.completed,0)+COALESCE(t.completed,0) AS completed,
			g.status AS current_status
		FROM goals g
		LEFT JOIN (
			SELECT gp.goal_id, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE proj.status='completed')::int AS completed
			FROM goal_projects gp JOIN projects proj ON proj.id=gp.project_id GROUP BY gp.goal_id
		) p ON p.goal_id=g.id
		LEFT JOIN (
			SELECT gt.goal_id, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE tk.status='completed')::int AS completed
			FROM goal_tasks gt JOIN tasks tk ON tk.id=gt.task_id GROUP BY gt.goal_id
		) t ON t.goal_id=g.id
		WHERE g.id=$1 AND g.workspace_id=$2
	`
	var total, completed int
	var current string
	err := r.db.QueryRow(ctx, query, goalID, workspaceID).Scan(&total, &completed, &current)
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
	} else if completed == total {
		newStatus = "completed"
	} else {
		newStatus = current
	}
	if newStatus != current {
		if err := r.UpdateStatus(ctx, goalID, newStatus); err != nil {
			return "", err
		}
		return newStatus, nil
	}
	return current, nil
}
