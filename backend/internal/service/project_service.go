package service

import (
	"context"

	"backend/internal/model"
	"backend/internal/repository"
)

// ProjectService menangani table projects.

type ProjectService struct {
	projectRepository   *repository.ProjectRepository
	workspaceRepository *repository.WorkspaceRepository
}

func NewProjectService(
	projectRepository *repository.ProjectRepository,
	workspaceRepository *repository.WorkspaceRepository,
) *ProjectService {
	return &ProjectService{
		projectRepository:   projectRepository,
		workspaceRepository: workspaceRepository,
	}
}

func statusRank(s string) int {
	switch s {
	case "completed":
		return 4
	case "in_progress":
		return 3
	case "not_started":
		return 2
	case "archived":
		return 1
	default:
		return 0
	}
}

func (s *ProjectService) GetProjects(
	ctx context.Context,
	workspaceID int,
	userID int,
) ([]*model.Project, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	projects, err := s.projectRepository.ListByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	for i := 0; i < len(projects); i++ {
		for j := i + 1; j < len(projects); j++ {
			ri := statusRank(projects[i].Status)
			rj := statusRank(projects[j].Status)
			if rj > ri || (rj == ri && projects[j].UpdatedAt.After(projects[i].UpdatedAt)) {
				projects[i], projects[j] = projects[j], projects[i]
			}
		}
	}
	return projects, nil
}

func (s *ProjectService) GetStats(
	ctx context.Context,
	workspaceID int,
	userID int,
) (*model.ProjectStats, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.projectRepository.GetStats(ctx, workspaceID)
}
