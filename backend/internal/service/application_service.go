package service

import (
	"context"
	"encoding/json"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"
)

// ApplicationService menangani table job_applications.

type ApplicationService struct {
	applicationRepository *repository.JobApplicationRepository
	workspaceRepository   *repository.WorkspaceRepository
	eventBus              *EventBus
}

func NewApplicationService(
	applicationRepository *repository.JobApplicationRepository,
	workspaceRepository *repository.WorkspaceRepository,
	eventBus ...*EventBus,
) *ApplicationService {
	s := &ApplicationService{
		applicationRepository: applicationRepository,
		workspaceRepository:   workspaceRepository,
	}
	if len(eventBus) > 0 {
		s.eventBus = eventBus[0]
	}
	return s
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

func (s *ApplicationService) CreateApplication(
	ctx context.Context,
	workspaceID int,
	userID int,
	req model.CreateApplicationRequest,
) (*model.JobApplication, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	status := req.Status
	if status == "" {
		status = "wishlist"
	}
	app := &model.JobApplication{
		WorkspaceId: workspaceID,
		JobTitle:    req.JobTitle,
		CompanyName: req.CompanyName,
		Status:      status,
		DueDate:     req.DueDate,
		JobURL:      req.JobURL,
	}
	created, err := s.applicationRepository.Create(ctx, app)
	if err != nil {
		return nil, err
	}
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "application_created", "data": created}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
	}
	return created, nil
}

func (s *ApplicationService) UpdateApplication(
	ctx context.Context,
	workspaceID int,
	applicationID int,
	userID int,
	req model.UpdateApplicationRequest,
) (*model.JobApplication, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	if _, err := s.applicationRepository.FindByIDAndWorkspace(ctx, applicationID, workspaceID); err != nil {
		return nil, apperrors.ErrNotFound
	}
	updated, err := s.applicationRepository.Update(ctx, workspaceID, applicationID, req)
	if err != nil {
		return nil, err
	}
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "application_updated", "data": updated}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
	}
	return updated, nil
}

func (s *ApplicationService) DeleteApplication(
	ctx context.Context,
	workspaceID int,
	applicationID int,
	userID int,
) error {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return err
	}
	if err := s.applicationRepository.Delete(ctx, workspaceID, applicationID); err != nil {
		return err
	}
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "application_deleted", "data": map[string]int{"id": applicationID}}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
	}
	return nil
}
