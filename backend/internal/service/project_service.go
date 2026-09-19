package service

import (
	"context"
	"encoding/json"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"
)

// ProjectService menangani table projects.

type ProjectService struct {
	projectRepository   *repository.ProjectRepository
	workspaceRepository *repository.WorkspaceRepository
	goalRepository      *repository.GoalRepository
	eventBus            *EventBus
}

func NewProjectService(
	projectRepository *repository.ProjectRepository,
	workspaceRepository *repository.WorkspaceRepository,
	goalRepository *repository.GoalRepository,
	eventBus *EventBus,
) *ProjectService {
	return &ProjectService{
		projectRepository:   projectRepository,
		workspaceRepository: workspaceRepository,
		goalRepository:      goalRepository,
		eventBus:            eventBus,
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

func (s *ProjectService) DeleteProject(
	ctx context.Context,
	workspaceID int,
	projectID int,
	userID int,
) error {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return err
	}
	// catat goal yang terhubung sebelum dihapus (relasi cascade ikut terhapus)
	goalIDs, _ := s.goalRepository.FindGoalIDsByProjectID(ctx, projectID)
	if err := s.projectRepository.Delete(ctx, workspaceID, projectID); err != nil {
		return err
	}
	for _, gid := range goalIDs {
		s.goalRepository.RecalculateAndUpdateStatus(ctx, gid, workspaceID)
	}
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "project_deleted", "data": map[string]int{"id": projectID}}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if b, err := json.Marshal(map[string]interface{}{"type": "goals_refresh", "workspace_id": workspaceID}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
	}
	return nil
}

func (s *ProjectService) CreateProject(
	ctx context.Context,
	workspaceID int,
	userID int,
	req model.CreateProjectRequest,
) (*model.Project, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	project := &model.Project{
		WorkspaceId:        workspaceID,
		ProjectName:        req.ProjectName,
		ProjectDescription: req.ProjectDescription,
		Status:             "not_started",
	}
	created, err := s.projectRepository.Create(ctx, project)
	if err != nil {
		return nil, err
	}
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "project_created", "data": created}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if b, err := json.Marshal(map[string]interface{}{"type": "goals_refresh", "workspace_id": workspaceID}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
	}
	return created, nil
}

func (s *ProjectService) UpdateProject(
	ctx context.Context,
	workspaceID int,
	projectID int,
	userID int,
	req model.UpdateProjectRequest,
) (*model.Project, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	if _, err := s.projectRepository.FindByIDAndWorkspace(ctx, projectID, workspaceID); err != nil {
		return nil, apperrors.ErrNotFound
	}
	updated, err := s.projectRepository.Update(ctx, workspaceID, projectID, req)
	if err != nil {
		return nil, err
	}
	// status project memengaruhi progress goals yang terhubung
	if req.Status != nil {
		if goalIDs, err := s.goalRepository.FindGoalIDsByProjectID(ctx, updated.ID); err == nil {
			for _, gid := range goalIDs {
				s.goalRepository.RecalculateAndUpdateStatus(ctx, gid, workspaceID)
			}
		}
	}
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "project_updated", "data": updated}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if b, err := json.Marshal(map[string]interface{}{"type": "goals_refresh", "workspace_id": workspaceID}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if req.Status != nil {
			if goalIDs, err := s.goalRepository.FindGoalIDsByProjectID(ctx, updated.ID); err == nil {
				for _, gid := range goalIDs {
					if goals, err := s.goalRepository.GetGoalsWithProgress(ctx, workspaceID); err == nil {
						for _, g := range goals {
							if g.ID == gid {
								if b, err := json.Marshal(map[string]interface{}{"type": "goal_progress", "data": g}); err == nil {
									s.eventBus.Publish(workspaceID, b)
								}
								break
							}
						}
					}
				}
			}
		}
	}
	return updated, nil
}
