package model

import "time"

type Project struct {
	ID                 int       `json:"id" db:"id"`
	WorkspaceId        int       `json:"workspace_id" db:"workspace_id"`
	ProjectName        string    `json:"project_name" db:"project_name"`
	ProjectDescription *string   `json:"project_description" db:"project_description"`
	Status             string    `json:"status" db:"status"`
	TotalTasks         int       `json:"total_tasks"`
	CompletedTasks     int       `json:"completed_tasks"`
	Progress           int       `json:"progress"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

type CreateProjectRequest struct {
	ProjectName        string  `json:"project_name" binding:"required,min=1,max=255"`
	ProjectDescription *string `json:"project_description"`
}

type UpdateProjectRequest struct {
	ProjectName        *string `json:"project_name" binding:"omitempty,min=1,max=255"`
	ProjectDescription *string `json:"project_description"`
	Status             *string `json:"status" binding:"omitempty,oneof=not_started in_progress completed archived"`
}
