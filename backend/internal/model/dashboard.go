package model

import "time"

type PrimaryGoal struct {
	ID                int       `json:"id" db:"id"`
	WorkspaceId       int       `json:"workspace_id" db:"workspace_id"`
	Title             string    `json:"title" db:"title"`
	Description       *string   `json:"description" db:"description"`
	Status            string    `json:"status" db:"status"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time `json:"updated_at" db:"updated_at"`
	TotalProjects     int       `json:"total_projects"`
	CompletedProjects int       `json:"completed_projects"`
	TotalTasks        int       `json:"total_tasks"`
	CompletedTasks    int       `json:"completed_tasks"`
	TotalRequirements int       `json:"total_requirements"`
	CompletedReqs     int       `json:"completed_requirements"`
	Progress          int       `json:"progress"`
}

type GoalStats struct {
	Total       int `json:"total"`
	NotStarted  int `json:"not_started"`
	InProgress  int `json:"in_progress"`
	Completed   int `json:"completed"`
	Archived    int `json:"archived"`
}

type ProjectStats struct {
	Total       int `json:"total"`
	NotStarted  int `json:"not_started"`
	InProgress  int `json:"in_progress"`
	Completed   int `json:"completed"`
	Archived    int `json:"archived"`
}

type TaskStats struct {
	Total          int `json:"total"`
	NotStarted     int `json:"not_started"`
	InProgress     int `json:"in_progress"`
	Completed      int `json:"completed"`
	Archived       int `json:"archived"`
	Pending        int `json:"pending"`
	HighPriority   int `json:"high_priority"`
	MediumPriority int `json:"medium_priority"`
	LowPriority    int `json:"low_priority"`
}

type ApplicationStats struct {
	Total       int `json:"total"`
	Wishlist    int `json:"wishlist"`
	Applied     int `json:"applied"`
	Interviewing int `json:"interviewing"`
	Offered     int `json:"offered"`
	Rejected    int `json:"rejected"`
}

type DashboardMetrics struct {
	Goals        GoalStats        `json:"goals"`
	Tasks        TaskStats        `json:"tasks"`
	Projects     ProjectStats     `json:"projects"`
	Applications ApplicationStats `json:"applications"`
}
