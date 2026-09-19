package model

import "time"

type User struct {
	ID                int       `json:"id" db:"id"`
	Username          string    `json:"username" db:"username"`
	PhotoProfile      *string   `json:"photo_profile" db:"photo_profile"`
	Email             string    `json:"email" db:"email"`
	PasswordHash      *string   `json:"-" db:"password_hash"`
	GoogleID          *string   `json:"-" db:"google_id"`
	ActiveWorkspaceId *int      `json:"active_workspace_id" db:"active_workspace_id"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}

type UpdateProfileRequest struct {
	Username *string `json:"username" binding:"omitempty,min=3,max=50"`
	Email    *string `json:"email" binding:"omitempty,email,max=100"`
}
