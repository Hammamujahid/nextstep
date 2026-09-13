package model

import "time"

type Project struct {
	ID                 int       `json:"id" db:"id"`
	WorkspaceId        int       `json:"workspace_id" db:"workspace_id"`
	ProjectName        string    `json:"project_name" db:"project_name"`
	ProjectDescription *string   `json:"project_description" db:"project_description"`
	Status             string    `json:"status" db:"status"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}
