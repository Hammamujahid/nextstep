package handler

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	dashboardService   *service.DashboardService
	goalService        *service.GoalService
	projectService     *service.ProjectService
	taskService        *service.TaskService
	applicationService *service.ApplicationService
	permissionRepo     *repository.PermissionRepository
}

func NewDashboardHandler(
	dashboardService *service.DashboardService,
	goalService *service.GoalService,
	projectService *service.ProjectService,
	taskService *service.TaskService,
	applicationService *service.ApplicationService,
	permissionRepo *repository.PermissionRepository,
) *DashboardHandler {
	return &DashboardHandler{
		dashboardService:   dashboardService,
		goalService:        goalService,
		projectService:     projectService,
		taskService:        taskService,
		applicationService: applicationService,
		permissionRepo:     permissionRepo,
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

	// samarkan section yang permission-nya none (non-admin): nol-kan angkanya
	if role, perms, perr := h.permissionRepo.GetAllPermissions(c.Request.Context(), workspaceID, userID); perr == nil && role != "admin" {
		if perms["goal"] == "none" {
			metrics.Goals = model.GoalStats{}
		}
		if perms["task"] == "none" {
			metrics.Tasks = model.TaskStats{}
		}
		if perms["project"] == "none" {
			metrics.Projects = model.ProjectStats{}
		}
		if perms["job_application"] == "none" {
			metrics.Applications = model.ApplicationStats{}
		}
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

func (h *DashboardHandler) CreateProject(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	var req model.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Validation failed", "details": validationMessages(err)})
		return
	}
	userID := c.GetInt("userID")
	project, err := h.projectService.CreateProject(c.Request.Context(), workspaceID, userID, req)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		log.Println("create project error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create project"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": project})
}

func (h *DashboardHandler) DeleteProject(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	projectID, err := strconv.Atoi(c.Param("projectId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid project id"})
		return
	}
	userID := c.GetInt("userID")
	if err := h.projectService.DeleteProject(c.Request.Context(), workspaceID, projectID, userID); err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Project not found"})
			return
		}
		log.Println("delete project error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to delete project"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

func (h *DashboardHandler) UpdateProject(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	projectID, err := strconv.Atoi(c.Param("projectId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid project id"})
		return
	}
	var req model.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Validation failed", "details": validationMessages(err)})
		return
	}
	userID := c.GetInt("userID")
	project, err := h.projectService.UpdateProject(c.Request.Context(), workspaceID, projectID, userID, req)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Project not found"})
			return
		}
		log.Println("update project error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update project"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": project})
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

func (h *DashboardHandler) UpdateGoal(c *gin.Context) {
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
	var req model.UpdateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Validation failed", "details": validationMessages(err)})
		return
	}
	userID := c.GetInt("userID")
	goal, err := h.goalService.UpdateGoal(c.Request.Context(), workspaceID, goalID, userID, req)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Goal not found"})
			return
		}
		log.Println("update goal error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update goal"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": goal})
}

func (h *DashboardHandler) DeleteGoal(c *gin.Context) {
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
	if err := h.goalService.DeleteGoal(c.Request.Context(), workspaceID, goalID, userID); err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Goal not found"})
			return
		}
		log.Println("delete goal error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to delete goal"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Goal deleted successfully"})
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

func (h *DashboardHandler) CreateApplication(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	var req model.CreateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Validation failed", "details": validationMessages(err)})
		return
	}
	userID := c.GetInt("userID")
	app, err := h.applicationService.CreateApplication(c.Request.Context(), workspaceID, userID, req)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		log.Println("create application error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create application"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": app})
}

func (h *DashboardHandler) UpdateApplication(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	applicationID, err := strconv.Atoi(c.Param("applicationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid application id"})
		return
	}
	var req model.UpdateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Validation failed", "details": validationMessages(err)})
		return
	}
	userID := c.GetInt("userID")
	updated, err := h.applicationService.UpdateApplication(c.Request.Context(), workspaceID, applicationID, userID, req)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Application not found"})
			return
		}
		log.Println("update application error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update application"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": updated})
}

func (h *DashboardHandler) DeleteApplication(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	applicationID, err := strconv.Atoi(c.Param("applicationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid application id"})
		return
	}
	userID := c.GetInt("userID")
	if err := h.applicationService.DeleteApplication(c.Request.Context(), workspaceID, applicationID, userID); err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Application not found"})
			return
		}
		log.Println("delete application error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to delete application"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Application deleted successfully"})
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
		if errors.Is(err, apperrors.ErrForbidden) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You don't have access to this resource"})
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
		if errors.Is(err, apperrors.ErrForbidden) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You don't have access to this resource"})
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

func (h *DashboardHandler) DeleteTask(c *gin.Context) {
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
	if err := h.taskService.DeleteTask(c.Request.Context(), workspaceID, taskID, userID); err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"message": "Task not found"})
			return
		}
		log.Println("delete task error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to delete task"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
