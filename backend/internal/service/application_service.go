package service

import (
	"context"

	"backend/internal/model"
	"backend/internal/repository"
)

// ApplicationService menangani table job_applications.

type ApplicationService struct {
	applicationRepository *repository.JobApplicationRepository
	workspaceRepository   *repository.WorkspaceRepository
}

func NewApplicationService(
	applicationRepository *repository.JobApplicationRepository,
	workspaceRepository *repository.WorkspaceRepository,
) *ApplicationService {
	return &ApplicationService{
		applicationRepository: applicationRepository,
		workspaceRepository:   workspaceRepository,
	}
}

func (s *ApplicationService) GetApplications(
	ctx context.Context,
	workspaceID int,
	userID int,
) ([]*model.JobApplication, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	apps, err := s.applicationRepository.ListByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	for i := 0; i < len(apps); i++ {
		for j := i + 1; j < len(apps); j++ {
			if apps[j].UpdatedAt.After(apps[i].UpdatedAt) {
				apps[i], apps[j] = apps[j], apps[i]
			}
		}
	}
	return apps, nil
}

func (s *ApplicationService) GetStats(
	ctx context.Context,
	workspaceID int,
	userID int,
) (*model.ApplicationStats, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.applicationRepository.GetStats(ctx, workspaceID)
}
