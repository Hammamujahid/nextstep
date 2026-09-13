package model

import "time"

type GoalTask struct {
	ID        int       `json:"id" db:"id"`
	GoalId    int       `json:"goal_id" db:"goal_id"`
	TaskId    int       `json:"task_id" db:"task_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
