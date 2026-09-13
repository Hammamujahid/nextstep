package model

import "time"

type WorkspaceMember struct {
	ID          int       `json:"id" db:"id"`
	WorkspaceId int       `json:"workspace_id" db:"workspace_id"`
	UserId      int       `json:"user_id" db:"user_id"`
	MemberRole  string    `json:"member_role" db:"member_role"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}
