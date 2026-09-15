package service

import (
	"context"

	"backend/internal/model"
	"backend/internal/repository"
)

// DashboardService sekarang hanya aggregator untuk metrics.
// Logic per table sudah dipindah ke file-by-table: task_service.go, project_service.go, goal_service.go, application_service.go
// Sesuai request: servicenya file by table.

type DashboardService struct {
	goalRepository        *repository.GoalRepository
	projectRepository     *repository.ProjectRepository
	taskRepository        *repository.TaskRepository
	applicationRepository *repository.JobApplicationRepository
	workspaceRepository   *repository.WorkspaceRepository
}

func NewDashboardService(
	goalRepository *repository.GoalRepository,
	projectRepository *repository.ProjectRepository,
	taskRepository *repository.TaskRepository,
	applicationRepository *repository.JobApplicationRepository,
	workspaceRepository *repository.WorkspaceRepository,
) *DashboardService {
	return &DashboardService{
		goalRepository:        goalRepository,
		projectRepository:     projectRepository,
		taskRepository:        taskRepository,
		applicationRepository: applicationRepository,
		workspaceRepository:   workspaceRepository,
	}
}

func (s *DashboardService) GetMetrics(
	ctx context.Context,
	workspaceID int,
	userID int,
) (*model.DashboardMetrics, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	goalStats, err := s.goalRepository.GetStats(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	projectStats, err := s.projectRepository.GetStats(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	taskStats, err := s.taskRepository.GetStats(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	applicationStats, err := s.applicationRepository.GetStats(ctx, workspaceID)
	if err != nil {
		return nil, err
	}

	return &model.DashboardMetrics{
		Goals:        *goalStats,
		Projects:     *projectStats,
		Tasks:        *taskStats,
		Applications: *applicationStats,
	}, nil
}
