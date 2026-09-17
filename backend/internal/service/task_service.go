package service

import (
	"context"
	"encoding/json"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"
)

// TaskService menangani semua operasi untuk table tasks.
// File by table: semua logic tasks dipusatkan di sini.

type TaskService struct {
	taskRepository      *repository.TaskRepository
	workspaceRepository *repository.WorkspaceRepository
	projectRepository   *repository.ProjectRepository
	goalRepository      *repository.GoalRepository
	eventBus            *EventBus
}

func NewTaskService(
	taskRepository *repository.TaskRepository,
	workspaceRepository *repository.WorkspaceRepository,
	projectRepository *repository.ProjectRepository,
	goalRepository *repository.GoalRepository,
	eventBus *EventBus,
) *TaskService {
	return &TaskService{
		taskRepository:      taskRepository,
		workspaceRepository: workspaceRepository,
		projectRepository:   projectRepository,
		goalRepository:      goalRepository,
		eventBus:            eventBus,
	}
}

func priorityRank(p string) int {
	switch p {
	case "high":
		return 1
	case "medium":
		return 2
	case "low":
		return 3
	default:
		return 4
	}
}

// GetTasks mengambil tasks untuk workspace dengan urutan default:
// priority tertinggi -> due_date terdekat -> updated terbaru.
// Ini dipakai oleh tag NextSteps di DashboardHome (limit 4 di frontend).
func (s *TaskService) GetTasks(
	ctx context.Context,
	workspaceID int,
	userID int,
) ([]*model.Task, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	tasks, err := s.taskRepository.ListByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	// repository sudah ORDER BY priority,due_date, tapi tetap sortir in-memory untuk kepastian
	for i := 0; i < len(tasks); i++ {
		for j := i + 1; j < len(tasks); j++ {
			ri := priorityRank(tasks[i].Priority)
			rj := priorityRank(tasks[j].Priority)
			shouldSwap := false
			if rj < ri {
				shouldSwap = true
			} else if rj == ri {
				di := tasks[i].DueDate
				dj := tasks[j].DueDate
				switch {
				case di == nil && dj != nil:
					shouldSwap = true
				case di == nil && dj == nil:
					if tasks[j].UpdatedAt.After(tasks[i].UpdatedAt) {
						shouldSwap = true
					}
				case di != nil && dj == nil:
					// keep i before j
				case di != nil && dj != nil:
					if dj.Before(*di) {
						shouldSwap = true
					} else if di.Equal(*dj) && tasks[j].UpdatedAt.After(tasks[i].UpdatedAt) {
						shouldSwap = true
					}
				}
			}
			if shouldSwap {
				tasks[i], tasks[j] = tasks[j], tasks[i]
			}
		}
	}
	return tasks, nil
}

func (s *TaskService) CreateTask(
	ctx context.Context,
	workspaceID int,
	userID int,
	req model.CreateTaskRequest,
) (*model.Task, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	if req.ProjectId != nil {
		proj, err := s.projectRepository.FindByID(ctx, *req.ProjectId)
		if err != nil || proj.WorkspaceId != workspaceID {
			return nil, apperrors.ErrNotFound
		}
	}
	if req.GoalId != nil {
		goal, err := s.goalRepository.FindByIDAndWorkspace(ctx, *req.GoalId, workspaceID)
		if err != nil || goal == nil {
			return nil, apperrors.ErrNotFound
		}
	}
	status := req.Status
	if status == "" {
		status = "not_started"
	}
	estimated := 30
	if req.EstimatedMinutes != nil && *req.EstimatedMinutes > 0 {
		estimated = *req.EstimatedMinutes
	}
	task := &model.Task{
		WorkspaceId:      workspaceID,
		ProjectId:        req.ProjectId,
		Title:            req.Title,
		Description:      req.Description,
		Priority:         req.Priority,
		Status:           status,
		DueDate:          req.DueDate,
		EstimatedMinutes: estimated,
	}
	created, err := s.taskRepository.Create(ctx, task)
	if err != nil {
		return nil, err
	}
	if req.GoalId != nil {
		if err := s.goalRepository.AddTaskToGoal(ctx, *req.GoalId, created.ID); err != nil {
			return nil, err
		}
		// auto-update goal status berdasarkan progress
		if _, err := s.goalRepository.RecalculateAndUpdateStatus(ctx, *req.GoalId, workspaceID); err == nil {
			// publish akan dilakukan di bawah
		}
	}
	// SSE: publish task created + goals refresh untuk progress bar
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "task_created", "data": created}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if b, err := json.Marshal(map[string]interface{}{"type": "goals_refresh", "workspace_id": workspaceID}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		// jika ada goal, publish goal_progress terbaru
		if req.GoalId != nil {
			if goals, err := s.goalRepository.GetGoalsWithProgress(ctx, workspaceID); err == nil {
				for _, g := range goals {
					if g.ID == *req.GoalId {
						if b, err := json.Marshal(map[string]interface{}{"type": "goal_progress", "data": g}); err == nil {
							s.eventBus.Publish(workspaceID, b)
						}
						break
					}
				}
			}
		}
	}
	return created, nil
}

func (s *TaskService) ToggleTask(
	ctx context.Context,
	workspaceID int,
	taskID int,
	userID int,
) (*model.Task, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	if _, err := s.taskRepository.FindByIDAndWorkspace(ctx, taskID, workspaceID); err != nil {
		return nil, apperrors.ErrNotFound
	}
	updated, err := s.taskRepository.ToggleComplete(ctx, workspaceID, taskID)
	if err != nil {
		return nil, err
	}
	// auto-update goal status untuk semua goal yang terhubung
	if goalIDs, err := s.goalRepository.FindGoalIDsByTaskID(ctx, updated.ID); err == nil {
		for _, gid := range goalIDs {
			s.goalRepository.RecalculateAndUpdateStatus(ctx, gid, workspaceID)
		}
	}
	// SSE: publish task toggled + goals refresh untuk progress bar
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "task_toggled", "data": updated}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if b, err := json.Marshal(map[string]interface{}{"type": "task_updated", "data": updated}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if b, err := json.Marshal(map[string]interface{}{"type": "goals_refresh", "workspace_id": workspaceID}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		// juga publish goal-specific progress jika task terhubung ke goal
		if goalIDs, err := s.goalRepository.FindGoalIDsByTaskID(ctx, updated.ID); err == nil {
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
	return updated, nil
}

func (s *TaskService) UpdateTask(
	ctx context.Context,
	workspaceID int,
	taskID int,
	userID int,
	req model.UpdateTaskRequest,
) (*model.Task, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	if _, err := s.taskRepository.FindByIDAndWorkspace(ctx, taskID, workspaceID); err != nil {
		return nil, apperrors.ErrNotFound
	}
	if req.ProjectId != nil {
		proj, err := s.projectRepository.FindByID(ctx, *req.ProjectId)
		if err != nil || proj.WorkspaceId != workspaceID {
			return nil, apperrors.ErrNotFound
		}
	}
	if req.GoalId != nil {
		goal, err := s.goalRepository.FindByIDAndWorkspace(ctx, *req.GoalId, workspaceID)
		if err != nil || goal == nil {
			return nil, apperrors.ErrNotFound
		}
	}
	updated, err := s.taskRepository.Update(ctx, workspaceID, taskID, req)
	if err != nil {
		return nil, err
	}
	if req.GoalId != nil {
		if err := s.goalRepository.AddTaskToGoal(ctx, *req.GoalId, updated.ID); err == nil {
			s.goalRepository.RecalculateAndUpdateStatus(ctx, *req.GoalId, workspaceID)
		}
	}
	// jika status berubah, recalc semua goal terkait
	if req.Status != nil {
		if goalIDs, err := s.goalRepository.FindGoalIDsByTaskID(ctx, updated.ID); err == nil {
			for _, gid := range goalIDs {
				s.goalRepository.RecalculateAndUpdateStatus(ctx, gid, workspaceID)
			}
		}
	}
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "task_updated", "data": updated}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if b, err := json.Marshal(map[string]interface{}{"type": "goals_refresh", "workspace_id": workspaceID}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if req.Status != nil {
			if goalIDs, err := s.goalRepository.FindGoalIDsByTaskID(ctx, updated.ID); err == nil {
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
