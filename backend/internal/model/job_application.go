package model

import "time"

type JobApplication struct {
	ID          int        `json:"id" db:"id"`
	WorkspaceId int        `json:"workspace_id" db:"workspace_id"`
	JobTitle    string     `json:"job_title" db:"job_title"`
	CompanyName string     `json:"company_name" db:"company_name"`
	Status      string     `json:"status" db:"status"`
	DueDate     *time.Time `json:"due_date" db:"due_date"`
	JobURL      *string    `json:"job_url" db:"job_url"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateApplicationRequest struct {
	JobTitle    string     `json:"job_title" binding:"required,min=1,max=255"`
	CompanyName string     `json:"company_name" binding:"required,min=1,max=255"`
	Status      string     `json:"status" binding:"omitempty,oneof=wishlist applied under_review interviewing offered rejected"`
	DueDate     *time.Time `json:"due_date"`
	JobURL      *string    `json:"job_url" binding:"omitempty,max=2048"`
}

type UpdateApplicationRequest struct {
	JobTitle    *string    `json:"job_title" binding:"omitempty,min=1,max=255"`
	CompanyName *string    `json:"company_name" binding:"omitempty,min=1,max=255"`
	Status      *string    `json:"status" binding:"omitempty,oneof=wishlist applied under_review interviewing offered rejected"`
	DueDate     *time.Time `json:"due_date"`
	ClearDueDate *bool     `json:"clear_due_date"`
	JobURL      *string    `json:"job_url" binding:"omitempty,max=2048"`
}
