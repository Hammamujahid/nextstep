package router

import (
	"github.com/gin-gonic/gin"

	"backend/internal/handler"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/service"
)

func New(
	authHandler *handler.AuthHandler,
	workspaceHandler *handler.WorkspaceHandler,
	userHandler *handler.UserHandler,
	dashboardHandler *handler.DashboardHandler,
	sseHandler *handler.SSEHandler,
	jwtService *service.JWTService,
	blacklistRepo *repository.TokenBlacklistRepository,
	permissionRepo *repository.PermissionRepository,
	allowedOrigins []string,
) *gin.Engine {
	router := gin.Default()
	router.Use(middleware.CORS(allowedOrigins))

	api := router.Group("/api/v1")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.GET("/google/login", authHandler.GoogleLogin)
		auth.GET("/google/callback", authHandler.GoogleCallback)
	}

	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(jwtService, blacklistRepo))
	{
		protected.POST("/auth/logout", authHandler.Logout)
		protected.GET("/workspaces", workspaceHandler.List)
		protected.POST("/workspaces", workspaceHandler.Create)
		protected.PUT("/workspaces/:id", workspaceHandler.Update)
		protected.GET("/workspaces/:id/members", workspaceHandler.ListMembers)
		protected.POST("/workspaces/:id/invite", workspaceHandler.Invite)
		protected.POST("/workspaces/:id/select", workspaceHandler.SelectWorkspace)
		protected.DELETE("/workspaces/:id/invitations/:invitationId", workspaceHandler.CancelInvitation)
		protected.GET("/invitations", workspaceHandler.MyInvitations)
		protected.POST("/invitations/:id/accept", workspaceHandler.AcceptInvitation)
		protected.POST("/invitations/:id/decline", workspaceHandler.DeclineInvitation)
		protected.GET("/workspaces/:id/my-permissions", workspaceHandler.MyPermissions)
		protected.GET("/workspaces/:id/primary-goal", middleware.RequireResourcePermission(permissionRepo, "goal", false), dashboardHandler.GetPrimaryGoal)
		protected.GET("/workspaces/:id/metrics", dashboardHandler.GetMetrics)
		protected.GET("/workspaces/:id/tasks", middleware.RequireResourcePermission(permissionRepo, "task", false), dashboardHandler.GetTasks)
		protected.POST("/workspaces/:id/tasks", middleware.RequireResourcePermission(permissionRepo, "task", true), dashboardHandler.CreateTask)
		protected.PATCH("/workspaces/:id/tasks/:taskId", middleware.RequireResourcePermission(permissionRepo, "task", true), dashboardHandler.UpdateTask)
		protected.PATCH("/workspaces/:id/tasks/:taskId/toggle", middleware.RequireResourcePermission(permissionRepo, "task", true), dashboardHandler.ToggleTask)
		protected.DELETE("/workspaces/:id/tasks/:taskId", middleware.RequireResourcePermission(permissionRepo, "task", true), dashboardHandler.DeleteTask)
		protected.GET("/workspaces/:id/projects", middleware.RequireResourcePermission(permissionRepo, "project", false), dashboardHandler.GetProjects)
		protected.POST("/workspaces/:id/projects", middleware.RequireResourcePermission(permissionRepo, "project", true), dashboardHandler.CreateProject)
		protected.PATCH("/workspaces/:id/projects/:projectId", middleware.RequireResourcePermission(permissionRepo, "project", true), dashboardHandler.UpdateProject)
		protected.DELETE("/workspaces/:id/projects/:projectId", middleware.RequireResourcePermission(permissionRepo, "project", true), dashboardHandler.DeleteProject)
		protected.GET("/workspaces/:id/goals", middleware.RequireResourcePermission(permissionRepo, "goal", false), dashboardHandler.GetGoals)
		protected.POST("/workspaces/:id/goals", middleware.RequireResourcePermission(permissionRepo, "goal", true), dashboardHandler.CreateGoal)
		protected.PATCH("/workspaces/:id/goals/:goalId", middleware.RequireResourcePermission(permissionRepo, "goal", true), dashboardHandler.UpdateGoal)
		protected.DELETE("/workspaces/:id/goals/:goalId", middleware.RequireResourcePermission(permissionRepo, "goal", true), dashboardHandler.DeleteGoal)
		protected.GET("/workspaces/:id/goals/:goalId/tasks", middleware.RequireResourcePermission(permissionRepo, "goal", false), dashboardHandler.GetTasksForGoal)
		protected.GET("/workspaces/:id/goals/:goalId/projects", middleware.RequireResourcePermission(permissionRepo, "goal", false), dashboardHandler.GetProjectsForGoal)
		protected.GET("/workspaces/:id/events", sseHandler.Handle)
		protected.GET("/workspaces/:id/applications", middleware.RequireResourcePermission(permissionRepo, "job_application", false), dashboardHandler.GetApplications)
		protected.POST("/workspaces/:id/applications", middleware.RequireResourcePermission(permissionRepo, "job_application", true), dashboardHandler.CreateApplication)
		protected.PATCH("/workspaces/:id/applications/:applicationId", middleware.RequireResourcePermission(permissionRepo, "job_application", true), dashboardHandler.UpdateApplication)
		protected.DELETE("/workspaces/:id/applications/:applicationId", middleware.RequireResourcePermission(permissionRepo, "job_application", true), dashboardHandler.DeleteApplication)
		protected.GET("/me", userHandler.Me)
		protected.PATCH("/me", userHandler.UpdateProfile)
	}

	return router
}
