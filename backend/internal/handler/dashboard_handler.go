package handler

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	dashboardService   *service.DashboardService
	goalService        *service.GoalService
	projectService     *service.ProjectService
	taskService        *service.TaskService
	applicationService *service.ApplicationService
}

func NewDashboardHandler(
	dashboardService *service.DashboardService,
	goalService *service.GoalService,
	projectService *service.ProjectService,
	taskService *service.TaskService,
	applicationService *service.ApplicationService,
) *DashboardHandler {
	return &DashboardHandler{
		dashboardService:   dashboardService,
		goalService:        goalService,
		projectService:     projectService,
		taskService:        taskService,
		applicationService: applicationService,
	}
}

func (h *DashboardHandler) GetPrimaryGoal(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid workspace id",
		})
		return
	}

	userID := c.GetInt("userID")

	goal, err := h.goalService.GetPrimaryGoal(
		c.Request.Context(),
		workspaceID,
		userID,
	)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
			return
		}
		log.Println("get primary goal error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to load primary goal, please try again later",
		})
		return
	}

	if goal == nil {
		c.JSON(http.StatusOK, gin.H{
			"data":    nil,
			"message": "No goals found for this workspace",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": goal,
	})
}

func (h *DashboardHandler) GetMetrics(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid workspace id",
		})
		return
	}

	userID := c.GetInt("userID")

	metrics, err := h.dashboardService.GetMetrics(
		c.Request.Context(),
		workspaceID,
		userID,
	)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
			return
		}
		log.Println("get metrics error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to load metrics, please try again later",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": metrics,
	})
}

func (h *DashboardHandler) GetTasks(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	userID := c.GetInt("userID")
	tasks, err := h.taskService.GetTasks(c.Request.Context(), workspaceID, userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		log.Println("get tasks error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load tasks"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tasks})
}

func (h *DashboardHandler) GetProjects(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	userID := c.GetInt("userID")
	projects, err := h.projectService.GetProjects(c.Request.Context(), workspaceID, userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		log.Println("get projects error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load projects"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": projects})
}

func (h *DashboardHandler) GetGoals(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	userID := c.GetInt("userID")
	goals, err := h.goalService.GetGoals(c.Request.Context(), workspaceID, userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		log.Println("get goals error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load goals"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": goals})
}

func (h *DashboardHandler) CreateGoal(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	var req model.CreateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Validation failed", "details": validationMessages(err)})
		return
	}
	userID := c.GetInt("userID")
	goal, err := h.goalService.CreateGoal(c.Request.Context(), workspaceID, userID, req)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		log.Println("create goal error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create goal"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": goal})
}

func (h *DashboardHandler) GetTasksForGoal(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	goalID, err := strconv.Atoi(c.Param("goalId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid goal id"})
		return
	}
	userID := c.GetInt("userID")
	tasks, err := h.goalService.GetTasksForGoal(c.Request.Context(), workspaceID, goalID, userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Goal not found"})
			return
		}
		log.Println("get tasks for goal error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load tasks for goal"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": tasks})
}

func (h *DashboardHandler) GetProjectsForGoal(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	goalID, err := strconv.Atoi(c.Param("goalId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid goal id"})
		return
	}
	userID := c.GetInt("userID")
	projects, err := h.goalService.GetProjectsForGoal(c.Request.Context(), workspaceID, goalID, userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Goal not found"})
			return
		}
		log.Println("get projects for goal error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load projects for goal"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": projects})
}

func (h *DashboardHandler) GetApplications(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	userID := c.GetInt("userID")
	apps, err := h.applicationService.GetApplications(c.Request.Context(), workspaceID, userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		log.Println("get applications error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to load applications"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": apps})
}

func (h *DashboardHandler) CreateTask(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	var req model.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Validation failed", "details": validationMessages(err)})
		return
	}
	userID := c.GetInt("userID")
	task, err := h.taskService.CreateTask(c.Request.Context(), workspaceID, userID, req)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Project not found in this workspace"})
			return
		}
		log.Println("create task error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create task"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": task})
}

func (h *DashboardHandler) UpdateTask(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	taskID, err := strconv.Atoi(c.Param("taskId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid task id"})
		return
	}
	var req model.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Validation failed", "details": validationMessages(err)})
		return
	}
	userID := c.GetInt("userID")
	task, err := h.taskService.UpdateTask(c.Request.Context(), workspaceID, taskID, userID, req)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Task not found"})
			return
		}
		log.Println("update task error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update task"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": task})
}

func (h *DashboardHandler) ToggleTask(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	taskID, err := strconv.Atoi(c.Param("taskId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid task id"})
		return
	}
	userID := c.GetInt("userID")
	task, err := h.taskService.ToggleTask(c.Request.Context(), workspaceID, taskID, userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Task not found"})
			return
		}
		log.Println("toggle task error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to toggle task"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": task})
}
