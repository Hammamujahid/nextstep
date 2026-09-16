package service

import (
	"context"
	"encoding/json"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"
)

// GoalService menangani table goals.

type GoalService struct {
	goalRepository      *repository.GoalRepository
	workspaceRepository *repository.WorkspaceRepository
	eventBus            *EventBus
}

func NewGoalService(
	goalRepository *repository.GoalRepository,
	workspaceRepository *repository.WorkspaceRepository,
	eventBus ...*EventBus,
) *GoalService {
	gs := &GoalService{
		goalRepository:      goalRepository,
		workspaceRepository: workspaceRepository,
	}
	if len(eventBus) > 0 {
		gs.eventBus = eventBus[0]
	}
	return gs
}

func (s *GoalService) GetPrimaryGoal(
	ctx context.Context,
	workspaceID int,
	userID int,
) (*model.PrimaryGoal, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	goals, err := s.goalRepository.GetGoalsWithProgress(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	if len(goals) == 0 {
		return nil, nil
	}

	// Aturan pemilihan primary goal:
	// 1. Progress terbanyak namun <100%
	// 2. Jika semua 100%, yang terakhir di-completed (updated_at terbaru)
	// 3. Jika semua 0%, yang pertama dibuat (created_at terawal)
	var candidate *model.PrimaryGoal
	for _, g := range goals {
		if g.Progress > 0 && g.Progress < 100 {
			if candidate == nil ||
				g.Progress > candidate.Progress ||
				(g.Progress == candidate.Progress && g.CompletedReqs > candidate.CompletedReqs) ||
				(g.Progress == candidate.Progress && g.CompletedReqs == candidate.CompletedReqs && g.UpdatedAt.After(candidate.UpdatedAt)) {
				candidate = g
			}
		}
	}
	if candidate != nil {
		return candidate, nil
	}

	var hasCompleted bool
	for _, g := range goals {
		if g.Progress == 100 {
			hasCompleted = true
			break
		}
	}
	if hasCompleted {
		var latest *model.PrimaryGoal
		for _, g := range goals {
			if g.Progress == 100 {
				if latest == nil || g.UpdatedAt.After(latest.UpdatedAt) {
					latest = g
				}
			}
		}
		return latest, nil
	}

	earliest := goals[0]
	for _, g := range goals[1:] {
		if g.CreatedAt.Before(earliest.CreatedAt) {
			earliest = g
		}
	}
	return earliest, nil
}

func (s *GoalService) GetGoals(
	ctx context.Context,
	workspaceID int,
	userID int,
) ([]*model.PrimaryGoal, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	goals, err := s.goalRepository.GetGoalsWithProgress(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	// goal snapshot: status tertinggi -> task completed terbanyak -> updated terbaru
	for i := 0; i < len(goals); i++ {
		for j := i + 1; j < len(goals); j++ {
			ri := statusRank(goals[i].Status)
			rj := statusRank(goals[j].Status)
			if rj > ri ||
				(rj == ri && goals[j].CompletedTasks > goals[i].CompletedTasks) ||
				(rj == ri && goals[j].CompletedTasks == goals[i].CompletedTasks && goals[j].UpdatedAt.After(goals[i].UpdatedAt)) {
				goals[i], goals[j] = goals[j], goals[i]
			}
		}
	}
	return goals, nil
}

func (s *GoalService) GetTasksForGoal(
	ctx context.Context,
	workspaceID int,
	goalID int,
	userID int,
) ([]*model.Task, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	if _, err := s.goalRepository.FindByIDAndWorkspace(ctx, goalID, workspaceID); err != nil {
		return nil, apperrors.ErrNotFound
	}
	return s.goalRepository.ListTasksByGoal(ctx, goalID, workspaceID)
}

func (s *GoalService) GetProjectsForGoal(
	ctx context.Context,
	workspaceID int,
	goalID int,
	userID int,
) ([]*model.Project, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	if _, err := s.goalRepository.FindByIDAndWorkspace(ctx, goalID, workspaceID); err != nil {
		return nil, apperrors.ErrNotFound
	}
	return s.goalRepository.ListProjectsByGoal(ctx, goalID, workspaceID)
}

func (s *GoalService) CreateGoal(
	ctx context.Context,
	workspaceID int,
	userID int,
	req model.CreateGoalRequest,
) (*model.Goal, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	status := req.Status
	if status == "" {
		status = "not_started"
	}
	goal := &model.Goal{
		WorkspaceId: workspaceID,
		Title:       req.Title,
		Description: req.Description,
		Status:      status,
	}
	created, err := s.goalRepository.Create(ctx, goal)
	if err != nil {
		return nil, err
	}
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "goal_created", "data": created}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if b, err := json.Marshal(map[string]interface{}{"type": "goals_refresh", "workspace_id": workspaceID}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
	}
	return created, nil
}
