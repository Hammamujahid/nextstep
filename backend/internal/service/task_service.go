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
	permissionRepository *repository.PermissionRepository
	eventBus            *EventBus
}

func NewTaskService(
	taskRepository *repository.TaskRepository,
	workspaceRepository *repository.WorkspaceRepository,
	projectRepository *repository.ProjectRepository,
	goalRepository *repository.GoalRepository,
	permissionRepository *repository.PermissionRepository,
	eventBus *EventBus,
) *TaskService {
	return &TaskService{
		taskRepository:      taskRepository,
		workspaceRepository: workspaceRepository,
		projectRepository:   projectRepository,
		goalRepository:      goalRepository,
		permissionRepository: permissionRepository,
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

// requireLinkEditor memastikan member boleh menautkan/melepas task ke project/goal:
// butuh editor pada resource target. Admin selalu lolos (GetMemberPermission = editor).
func (s *TaskService) requireLinkEditor(ctx context.Context, workspaceID, userID int, resource string) error {
	_, perm, err := s.permissionRepository.GetMemberPermission(ctx, workspaceID, userID, resource)
	if err != nil {
		return err
	}
	if perm != "editor" {
		return apperrors.ErrForbidden
	}
	return nil
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
	// hybrid masking: samarkan relasi yang tidak boleh dilihat caller.
	// project=none -> project_id diset nil; goal=none -> goal_ids dikosongkan.
	// Task tetap terlihat karena route sudah lolos cek task readable di middleware.
	_, projPerm, projErr := s.permissionRepository.GetMemberPermission(ctx, workspaceID, userID, "project")
	_, goalPerm, goalErr := s.permissionRepository.GetMemberPermission(ctx, workspaceID, userID, "goal")
	if projErr != nil {
		projPerm = "none"
	}
	if goalErr != nil {
		goalPerm = "none"
	}
	if projPerm == "none" || goalPerm == "none" {
		for _, t := range tasks {
			if projPerm == "none" {
				t.ProjectId = nil
			}
			if goalPerm == "none" {
				t.GoalIDs = nil
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
		// menautkan ke project butuh editor pada project target
		if err := s.requireLinkEditor(ctx, workspaceID, userID, "project"); err != nil {
			return nil, err
		}
	}
	if req.GoalId != nil {
		goal, err := s.goalRepository.FindByIDAndWorkspace(ctx, *req.GoalId, workspaceID)
		if err != nil || goal == nil {
			return nil, apperrors.ErrNotFound
		}
		// menautkan ke goal butuh editor pada goal target
		if err := s.requireLinkEditor(ctx, workspaceID, userID, "goal"); err != nil {
			return nil, err
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
	// auto-update project status berdasarkan tasks (1 completed -> in_progress)
	if created.ProjectId != nil {
		s.projectRepository.RecalculateStatusFromTasks(ctx, *created.ProjectId, workspaceID)
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
	// auto-update project status berdasarkan tasks
	if updated.ProjectId != nil {
		s.projectRepository.RecalculateStatusFromTasks(ctx, *updated.ProjectId, workspaceID)
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

func (s *TaskService) DeleteTask(
	ctx context.Context,
	workspaceID int,
	taskID int,
	userID int,
) error {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return err
	}
	// catat goal & project yang terhubung sebelum dihapus (relasi cascade ikut terhapus)
	goalIDs, _ := s.goalRepository.FindGoalIDsByTaskID(ctx, taskID)
	oldTask, err := s.taskRepository.FindByIDAndWorkspace(ctx, taskID, workspaceID)
	if err != nil {
		return apperrors.ErrNotFound
	}
	if err := s.taskRepository.Delete(ctx, workspaceID, taskID); err != nil {
		return err
	}
	for _, gid := range goalIDs {
		s.goalRepository.RecalculateAndUpdateStatus(ctx, gid, workspaceID)
	}
	if oldTask.ProjectId != nil {
		s.projectRepository.RecalculateStatusFromTasks(ctx, *oldTask.ProjectId, workspaceID)
	}
	if s.eventBus != nil {
		if b, err := json.Marshal(map[string]interface{}{"type": "task_deleted", "data": map[string]int{"id": taskID}}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if b, err := json.Marshal(map[string]interface{}{"type": "goals_refresh", "workspace_id": workspaceID}); err == nil {
			s.eventBus.Publish(workspaceID, b)
		}
		if goals, err := s.goalRepository.GetGoalsWithProgress(ctx, workspaceID); err == nil {
			byID := make(map[int]*model.PrimaryGoal, len(goals))
			for _, g := range goals {
				byID[g.ID] = g
			}
			for _, gid := range goalIDs {
				if g, ok := byID[gid]; ok {
					if b, err := json.Marshal(map[string]interface{}{"type": "goal_progress", "data": g}); err == nil {
						s.eventBus.Publish(workspaceID, b)
					}
				}
			}
		}
	}
	return nil
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
	oldTask, err := s.taskRepository.FindByIDAndWorkspace(ctx, taskID, workspaceID)
	if err != nil {
		return nil, apperrors.ErrNotFound
	}
	if req.ProjectId != nil {
		proj, err := s.projectRepository.FindByID(ctx, *req.ProjectId)
		if err != nil || proj.WorkspaceId != workspaceID {
			return nil, apperrors.ErrNotFound
		}
		// pindah tautan ke project lain butuh editor pada project target
		if err := s.requireLinkEditor(ctx, workspaceID, userID, "project"); err != nil {
			return nil, err
		}
	}
	clearProject := req.ClearProjectId != nil && *req.ClearProjectId
	if clearProject && oldTask.ProjectId != nil {
		// melepas tautan project butuh editor pada project target
		if err := s.requireLinkEditor(ctx, workspaceID, userID, "project"); err != nil {
			return nil, err
		}
	}
	// goal di edit modal bersifat replace: GoalId = pindah ke goal tsb, ClearGoalId = lepas semua tautan
	clearGoal := req.ClearGoalId != nil && *req.ClearGoalId
	var oldGoalIDs []int
	if req.GoalId != nil || clearGoal {
		oldGoalIDs, _ = s.goalRepository.FindGoalIDsByTaskID(ctx, taskID)
	}
	if req.GoalId != nil {
		goal, err := s.goalRepository.FindByIDAndWorkspace(ctx, *req.GoalId, workspaceID)
		if err != nil || goal == nil {
			return nil, apperrors.ErrNotFound
		}
		// pindah tautan ke goal lain butuh editor pada goal target
		if err := s.requireLinkEditor(ctx, workspaceID, userID, "goal"); err != nil {
			return nil, err
		}
	}
	if clearGoal && len(oldGoalIDs) > 0 {
		// melepas tautan goal butuh editor pada goal target
		if err := s.requireLinkEditor(ctx, workspaceID, userID, "goal"); err != nil {
			return nil, err
		}
	}
	updated, err := s.taskRepository.Update(ctx, workspaceID, taskID, req)
	if err != nil {
		return nil, err
	}
	// auto-update project status (project lama & baru bila pindah)
	if oldTask.ProjectId != nil {
		s.projectRepository.RecalculateStatusFromTasks(ctx, *oldTask.ProjectId, workspaceID)
	}
	if updated.ProjectId != nil && (oldTask.ProjectId == nil || *updated.ProjectId != *oldTask.ProjectId) {
		s.projectRepository.RecalculateStatusFromTasks(ctx, *updated.ProjectId, workspaceID)
	}
	if req.GoalId != nil {
		// replace: lepas tautan lama lalu tautkan ke goal baru (hindari duplikat goal_tasks)
		_ = s.goalRepository.DeleteTaskGoals(ctx, taskID)
		if err := s.goalRepository.AddTaskToGoal(ctx, *req.GoalId, updated.ID); err != nil {
			return nil, err
		}
		seen := map[int]bool{*req.GoalId: true}
		for _, gid := range oldGoalIDs {
			if !seen[gid] {
				s.goalRepository.RecalculateAndUpdateStatus(ctx, gid, workspaceID)
				seen[gid] = true
			}
		}
		s.goalRepository.RecalculateAndUpdateStatus(ctx, *req.GoalId, workspaceID)
	} else if clearGoal {
		_ = s.goalRepository.DeleteTaskGoals(ctx, taskID)
		for _, gid := range oldGoalIDs {
			s.goalRepository.RecalculateAndUpdateStatus(ctx, gid, workspaceID)
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
		if req.Status != nil || req.GoalId != nil || clearGoal {
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
