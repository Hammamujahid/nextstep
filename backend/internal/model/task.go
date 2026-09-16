package model

import "time"

type Task struct {
	ID          int        `json:"id" db:"id"`
	WorkspaceId int        `json:"workspace_id" db:"workspace_id"`
	ProjectId   *int       `json:"project_id" db:"project_id"`
	Title       string     `json:"title" db:"title"`
	Description *string    `json:"description" db:"description"`
	Priority    string     `json:"priority" db:"priority"` // high | medium | low
	Status      string     `json:"status" db:"status"`     // not_started | in_progress | completed
	DueDate     *time.Time `json:"due_date" db:"due_date"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

type CreateTaskRequest struct {
	Title       string     `json:"title" binding:"required,min=1,max=255"`
	Description *string    `json:"description"`
	Priority    string     `json:"priority" binding:"required,oneof=high medium low"`
	Status      string     `json:"status" binding:"omitempty,oneof=not_started in_progress completed"`
	DueDate     *time.Time `json:"due_date"`
	ProjectId   *int       `json:"project_id"`
	GoalId      *int       `json:"goal_id"`
}

type UpdateTaskRequest struct {
	Title       *string    `json:"title" binding:"omitempty,min=1,max=255"`
	Description *string    `json:"description"`
	Priority    *string    `json:"priority" binding:"omitempty,oneof=high medium low"`
	Status      *string    `json:"status" binding:"omitempty,oneof=not_started in_progress completed"`
	DueDate     *time.Time `json:"due_date"`
	ProjectId   *int       `json:"project_id"`
	GoalId      *int       `json:"goal_id"`
}
