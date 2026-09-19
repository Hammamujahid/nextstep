package model

import "time"

type WorkspaceInvitation struct {
	ID                       int       `json:"id" db:"id"`
	WorkspaceId              int       `json:"workspace_id" db:"workspace_id"`
	Email                    string    `json:"email" db:"email"`
	Status                   string    `json:"status" db:"status"`
	ProjectPermission        string    `json:"project_permission" db:"project_permission"`
	TaskPermission           string    `json:"task_permission" db:"task_permission"`
	GoalPermission           string    `json:"goal_permission" db:"goal_permission"`
	JobApplicationPermission string    `json:"job_application_permission" db:"job_application_permission"`
	CreatedAt                time.Time `json:"created_at" db:"created_at"`
	UpdatedAt                time.Time `json:"updated_at" db:"updated_at"`
}

// WorkspaceInvitationWithWorkspace dipakai untuk inbox undangan milik user beserta nama workspacenya.
type WorkspaceInvitationWithWorkspace struct {
	WorkspaceInvitation
	WorkspaceName string `json:"workspace_name"`
}
