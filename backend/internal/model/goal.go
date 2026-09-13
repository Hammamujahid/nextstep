package model

import "time"

type Goal struct {
	ID          int       `json:"id" db:"id"`
	WorkspaceId int       `json:"workspace_id" db:"workspace_id"`
	Title       string    `json:"title" db:"title"`
	Description *string   `json:"description" db:"description"`
	Status      string    `json:"status" db:"status"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}
