package service

import (
	"context"

	"backend/internal/model"
	"backend/internal/repository"
)

// GoalService menangani table goals.

type GoalService struct {
	goalRepository      *repository.GoalRepository
	workspaceRepository *repository.WorkspaceRepository
}

func NewGoalService(
	goalRepository *repository.GoalRepository,
	workspaceRepository *repository.WorkspaceRepository,
) *GoalService {
	return &GoalService{
		goalRepository:      goalRepository,
		workspaceRepository: workspaceRepository,
	}
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

func (s *GoalService) GetStats(
	ctx context.Context,
	workspaceID int,
	userID int,
) (*model.GoalStats, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.goalRepository.GetStats(ctx, workspaceID)
}
