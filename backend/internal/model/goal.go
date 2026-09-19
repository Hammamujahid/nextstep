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

type CreateGoalRequest struct {
	Title       string  `json:"title" binding:"required,min=1,max=255"`
	Description *string `json:"description"`
	Status      string  `json:"status" binding:"omitempty,oneof=not_started in_progress completed archived"`
}

type UpdateGoalRequest struct {
	Title       *string `json:"title" binding:"omitempty,min=1,max=255"`
	Description *string `json:"description"`
	Status      *string `json:"status" binding:"omitempty,oneof=not_started in_progress completed archived"`
}
