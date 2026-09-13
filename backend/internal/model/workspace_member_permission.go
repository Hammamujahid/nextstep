package model

import "time"

type WorkspaceMemberPermission struct {
	ID                int       `json:"id" db:"id"`
	WorkspaceMemberId int       `json:"workspace_member_id" db:"workspace_member_id"`
	ResourceType      string    `json:"resource_type" db:"resource_type"`
	Permission        string    `json:"permission" db:"permission"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
}
