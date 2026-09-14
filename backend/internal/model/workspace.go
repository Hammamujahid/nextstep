package model

import "time"

type Workspace struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type CreateWorkspaceRequest struct {
	Name        string  `json:"name" binding:"required,min=3,max=100"`
	Description *string `json:"description" binding:"omitempty,max=500"`
}

type WorkspaceWithRole struct {
	Workspace
	MemberRole string `json:"member_role" db:"member_role"`
}

type InviteMemberRequest struct {
	Email string `json:"email" binding:"required,email,max=255"`
}

type WorkspaceMemberWithUser struct {
	ID         int       `json:"id" db:"id"`
	UserID     int       `json:"user_id" db:"user_id"`
	Username   string    `json:"username" db:"username"`
	Email      string    `json:"email" db:"email"`
	MemberRole string    `json:"member_role" db:"member_role"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}
