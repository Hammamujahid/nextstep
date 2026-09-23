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
	// auto under_review: yang sudah lewat due date berubah otomatis
	if _, err := r.db.Exec(ctx, `
		UPDATE job_applications SET status = 'under_review', updated_at = NOW()
		WHERE workspace_id = $1 AND due_date IS NOT NULL AND due_date < NOW()
			AND status IN ('wishlist', 'applied')
	`, workspaceID); err != nil {
		return nil, apperrors.ErrDatabase
	}
	query := `
		SELECT
			a.id, a.workspace_id, a.job_title, a.company_name, a.status, a.due_date, a.job_url,
			a.assignee_id, u.username, u.email,
			a.created_at, a.updated_at
		FROM job_applications a
		LEFT JOIN users u ON u.id = a.assignee_id
		WHERE a.workspace_id = $1
		ORDER BY a.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, workspaceID)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	defer rows.Close()

	apps := make([]*model.JobApplication, 0)
	for rows.Next() {
		var a model.JobApplication
		var assigneeID *int
		var assigneeName, assigneeEmail *string
		if err := rows.Scan(&a.ID, &a.WorkspaceId, &a.JobTitle, &a.CompanyName, &a.Status, &a.DueDate, &a.JobURL, &assigneeID, &assigneeName, &assigneeEmail, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, apperrors.ErrDatabase
		}
		a.AssigneeId, a.Assignee = ScanAssignee(assigneeID, assigneeName, assigneeEmail)
		apps = append(apps, &a)
	}
	if err := rows.Err(); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return apps, nil
}

func (r *JobApplicationRepository) FindByIDAndWorkspace(
	ctx context.Context,
	id int,
	workspaceID int,
) (*model.JobApplication, error) {
	var a model.JobApplication
	err := r.db.QueryRow(ctx,
		`SELECT id, workspace_id, job_title, company_name, status, due_date, job_url, created_at, updated_at FROM job_applications WHERE id = $1 AND workspace_id = $2`, id, workspaceID,
	).Scan(&a.ID, &a.WorkspaceId, &a.JobTitle, &a.CompanyName, &a.Status, &a.DueDate, &a.JobURL, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &a, nil
}

func (r *JobApplicationRepository) Update(
	ctx context.Context,
	workspaceID int,
	applicationID int,
	req model.UpdateApplicationRequest,
) (*model.JobApplication, error) {
	clearDue := req.ClearDueDate != nil && *req.ClearDueDate
	clearAssignee := req.ClearAssigneeId != nil && *req.ClearAssigneeId
	query := `
		UPDATE job_applications SET
			job_title = COALESCE($1, job_title),
			company_name = COALESCE($2, company_name),
			status = COALESCE($3, status),
			due_date = CASE WHEN $4 THEN NULL ELSE COALESCE($5, due_date) END,
			job_url = COALESCE($6, job_url),
			assignee_id = CASE WHEN $9 THEN NULL ELSE COALESCE($10, assignee_id) END,
			updated_at = NOW()
		WHERE id = $7 AND workspace_id = $8
		RETURNING id, workspace_id, job_title, company_name, status, due_date, job_url, assignee_id, created_at, updated_at
	`
	var updated model.JobApplication
	err := r.db.QueryRow(ctx, query,
		req.JobTitle,
		req.CompanyName,
		req.Status,
		clearDue,
		req.DueDate,
		req.JobURL,
		applicationID,
		workspaceID,
		clearAssignee,
		req.AssigneeId,
	).Scan(&updated.ID, &updated.WorkspaceId, &updated.JobTitle, &updated.CompanyName, &updated.Status, &updated.DueDate, &updated.JobURL, &updated.AssigneeId, &updated.CreatedAt, &updated.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	if updated.Assignee, err = FetchAssignee(ctx, r.db, updated.AssigneeId); err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *JobApplicationRepository) Delete(
	ctx context.Context,
	workspaceID int,
	applicationID int,
) error {
	res, err := r.db.Exec(ctx, `DELETE FROM job_applications WHERE id = $1 AND workspace_id = $2`, applicationID, workspaceID)
	if err != nil {
		return apperrors.ErrDatabase
	}
	if res.RowsAffected() == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (r *JobApplicationRepository) Create(
	ctx context.Context,
	app *model.JobApplication,
) (*model.JobApplication, error) {
	if app.Status == "" {
		app.Status = "wishlist"
	}
	query := `
		INSERT INTO job_applications (workspace_id, job_title, company_name, status, due_date, job_url, assignee_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, workspace_id, job_title, company_name, status, due_date, job_url, assignee_id, created_at, updated_at
	`
	var created model.JobApplication
	err := r.db.QueryRow(ctx, query,
		app.WorkspaceId,
		app.JobTitle,
		app.CompanyName,
		app.Status,
		app.DueDate,
		app.JobURL,
		app.AssigneeId,
	).Scan(&created.ID, &created.WorkspaceId, &created.JobTitle, &created.CompanyName, &created.Status, &created.DueDate, &created.JobURL, &created.AssigneeId, &created.CreatedAt, &created.UpdatedAt)
	if err != nil {
		return nil, apperrors.ErrDatabase
	}
	if created.Assignee, err = FetchAssignee(ctx, r.db, created.AssigneeId); err != nil {
		return nil, err
	}
	return &created, nil
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
			COUNT(*) FILTER (WHERE status = 'under_review')::int AS under_review,
			COUNT(*) FILTER (WHERE status = 'interviewing')::int AS interviewing,
			COUNT(*) FILTER (WHERE status = 'offered')::int AS offered,
			COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
		FROM job_applications
		WHERE workspace_id = $1
	`
	var s model.ApplicationStats
	if err := r.db.QueryRow(ctx, query, workspaceID).Scan(&s.Total, &s.Wishlist, &s.Applied, &s.UnderReview, &s.Interviewing, &s.Offered, &s.Rejected); err != nil {
		return nil, apperrors.ErrDatabase
	}
	return &s, nil
}
