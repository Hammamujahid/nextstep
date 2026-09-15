package service

import (
	"context"

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
}

func NewTaskService(
	taskRepository *repository.TaskRepository,
	workspaceRepository *repository.WorkspaceRepository,
	projectRepository *repository.ProjectRepository,
) *TaskService {
	return &TaskService{
		taskRepository:      taskRepository,
		workspaceRepository: workspaceRepository,
		projectRepository:   projectRepository,
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
	task := &model.Task{
		WorkspaceId: workspaceID,
		ProjectId:   req.ProjectId,
		Title:       req.Title,
		Description: req.Description,
		Priority:    req.Priority,
		IsCompleted: false,
		DueDate:     req.DueDate,
	}
	return s.taskRepository.Create(ctx, task)
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
	return s.taskRepository.Update(ctx, workspaceID, taskID, req)
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
	return s.taskRepository.ToggleComplete(ctx, workspaceID, taskID)
}

func (s *TaskService) GetStats(
	ctx context.Context,
	workspaceID int,
	userID int,
) (*model.TaskStats, error) {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.taskRepository.GetStats(ctx, workspaceID)
}
