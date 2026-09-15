package main

import (
	"log"

	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/handler"
	"backend/internal/repository"
	"backend/internal/router"
	"backend/internal/service"
)

func main() {
	cfg := config.Load()

	db := database.NewPostgresPool(cfg)
	defer db.Close()

	userRepository := repository.NewUserRepository(db)
	blacklistRepository := repository.NewTokenBlacklistRepository(db)
	workspaceRepository := repository.NewWorkspaceRepository(db)

	jwtService := service.NewJWTService(
		cfg.JWTSECRET,
	)

	googleOAuth := service.NewGoogleOAuth(
		cfg.GoogleClientID,
		cfg.GoogleClientSecret,
		cfg.GoogleRedirectURL,
	)

	authService := service.NewAuthService(
		userRepository,
		blacklistRepository,
		jwtService,
		googleOAuth,
		cfg.FrontendURL,
	)

	workspaceService := service.NewWorkspaceService(
		workspaceRepository,
	)
	goalRepository := repository.NewGoalRepository(db)
	projectRepository := repository.NewProjectRepository(db)
	taskRepository := repository.NewTaskRepository(db)
	applicationRepository := repository.NewJobApplicationRepository(db)
	dashboardService := service.NewDashboardService(
		goalRepository,
		projectRepository,
		taskRepository,
		applicationRepository,
		workspaceRepository,
	)
	// file-by-table services
	taskService := service.NewTaskService(taskRepository, workspaceRepository, projectRepository)
	projectService := service.NewProjectService(projectRepository, workspaceRepository)
	goalService := service.NewGoalService(goalRepository, workspaceRepository)
	applicationService := service.NewApplicationService(applicationRepository, workspaceRepository)

	authHandler := handler.NewAuthHandler(
		authService,
	)
	workspaceHandler := handler.NewWorkspaceHandler(
		workspaceService,
	)
	userHandler := handler.NewUserHandler(
		userRepository,
	)
	dashboardHandler := handler.NewDashboardHandler(
		dashboardService,
		goalService,
		projectService,
		taskService,
		applicationService,
	)

	r := router.New(
		authHandler,
		workspaceHandler,
		userHandler,
		dashboardHandler,
		jwtService,
		blacklistRepository,
		[]string{cfg.FrontendURL, "http://localhost:3000"},
	)

	log.Println("Server running on port", cfg.Port)

	r.Run(":" + cfg.Port)
}
