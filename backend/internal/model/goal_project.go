package model

import "time"

type GoalProject struct {
	ID        int       `json:"id" db:"id"`
	GoalId    int       `json:"goal_id" db:"goal_id"`
	ProjectId int       `json:"project_id" db:"project_id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
