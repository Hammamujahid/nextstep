package model

import "time"

type WorkspaceInvitation struct {
	ID          int       `json:"id" db:"id"`
	WorkspaceId int       `json:"workspace_id" db:"workspace_id"`
	Email       string    `json:"email" db:"email"`
	Status      string    `json:"status" db:"status"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}
