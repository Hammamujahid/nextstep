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
				COUNT(*) FILTER (WHERE tk.is_completed = true)::int AS completed
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
