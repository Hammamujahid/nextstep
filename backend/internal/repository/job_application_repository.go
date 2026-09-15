package repository

import (
	"context"

	"backend/internal/apperrors"
	"backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type JobApplicationRepository struct {
	db *pgxpool.Pool
}

func NewJobApplicationRepository(db *pgxpool.Pool) *JobApplicationRepository {
	return &JobApplicationRepository{db: db}
}

func (r *JobApplicationRepository) ListByWorkspace(
	ctx context.Context,
	workspaceID int,
) ([]*model.JobApplication, error) {
	query := `
		SELECT id, workspace_id, job_title, company_name, status, created_at, updated_at
		FROM job_applications
		WHERE workspace_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()

	apps := make([]*model.JobApplication, 0)
	for rows.Next() {
		var a model.JobApplication
		if err := rows.Scan(&a.ID, &a.WorkspaceId, &a.JobTitle, &a.CompanyName, &a.Status, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, apperrors.ErrDatabase
		}
		apps = append(apps, &a)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return apps, nil
}

func (r *JobApplicationRepository) GetStats(
	ctx context.Context,
	workspaceID int,
) (*model.ApplicationStats, error) {
	query := `
		SELECT
			COUNT(*)::int AS total,
			COUNT(*) FILTER (WHERE status = 'wishlist')::int AS wishlist,
			COUNT(*) FILTER (WHERE status = 'applied')::int AS applied,
			COUNT(*) FILTER (WHERE status = 'interviewing')::int AS interviewing,
			COUNT(*) FILTER (WHERE status = 'offered')::int AS offered,
			COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
		FROM job_applications
		WHERE workspace_id = $1
	`
	var s model.ApplicationStats
	if err := r.db.QueryRow(ctx, query, workspaceID).Scan(&s.Total, &s.Wishlist, &s.Applied, &s.Interviewing, &s.Offered, &s.Rejected); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &s, nil
}
