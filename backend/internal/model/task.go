package model

import "time"

type Task struct {
	ID          int        `json:"id" db:"id"`
	WorkspaceId int        `json:"workspace_id" db:"workspace_id"`
	Title       string     `json:"title" db:"title"`
	Description *string    `json:"description" db:"description"`
	Status      string     `json:"status" db:"status"`
	DueDate     *time.Time `json:"due_date" db:"due_date"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}
