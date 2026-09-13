package model

import "time"

type JobApplication struct {
	ID          int       `json:"id" db:"id"`
	WorkspaceId int       `json:"workspace_id" db:"workspace_id"`
	JobTitle    string    `json:"job_title" db:"job_title"`
	CompanyName string    `json:"company_name" db:"company_name"`
	Status      string    `json:"status" db:"status"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}
