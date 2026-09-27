package main

import (
	"log"
	"strings"

	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/handler"
	"backend/internal/repository"
	"backend/internal/router"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	// mode production: gin release (tanpa debug log/routes) + guard fail-fast.
	// Set APP_ENV=production di environment production.
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
		if len(cfg.JWTSECRET) < 32 {
			log.Fatal("Refusing to start: JWT_SECRET must be at least 32 characters in production")
		}
		if strings.EqualFold(strings.TrimSpace(cfg.DBSSLMode), "disable") {
			log.Println("WARNING: DB_SSLMODE=disable in production; use require/verify-full")
		}
	}

	db := database.NewPostgresPool(cfg)
	defer db.Close()

	userRepository := repository.NewUserRepository(db)
	blacklistRepository := repository.NewTokenBlacklistRepository(db)
	refreshRepository := repository.NewRefreshTokenRepository(db)
	workspaceRepository := repository.NewWorkspaceRepository(db)
	permissionRepository := repository.NewPermissionRepository(db)
	auditRepository := repository.NewAuditRepository(db)

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
		refreshRepository,
		jwtService,
		googleOAuth,
		cfg.FrontendURL,
	)

	workspaceService := service.NewWorkspaceService(
		workspaceRepository,
		userRepository,
		permissionRepository,
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
	eventBus := service.NewEventBus()
	// file-by-table services
	taskService := service.NewTaskService(taskRepository, workspaceRepository, projectRepository, goalRepository, permissionRepository, eventBus)
	projectService := service.NewProjectService(projectRepository, workspaceRepository, goalRepository, permissionRepository, eventBus)
	goalService := service.NewGoalService(goalRepository, workspaceRepository, permissionRepository, eventBus)
	applicationService := service.NewApplicationService(applicationRepository, workspaceRepository, permissionRepository, eventBus)
	sseHandler := handler.NewSSEHandler(eventBus, workspaceRepository)

	authHandler := handler.NewAuthHandler(
		authService,
		cfg,
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
		permissionRepository,
	)

	r := router.New(
		authHandler,
		workspaceHandler,
		userHandler,
		dashboardHandler,
		sseHandler,
		jwtService,
		blacklistRepository,
		permissionRepository,
		auditRepository,
		[]string{cfg.FrontendURL, "http://localhost:3000"},
	)

	// Di belakang reverse proxy (nginx/Caddy), IP klien asli hanya dipercaya
	// dari proxy yang terdaftar; tanpa ini rate limiter melihat IP proxy saja.
	// Kosongkan (= langsung, tanpa proxy) di dev; isi CIDR/IP proxy di prod.
	if len(cfg.TrustedProxies) > 0 {
		if err := r.SetTrustedProxies(cfg.TrustedProxies); err != nil {
			log.Fatal("Invalid TRUSTED_PROXIES:", err)
		}
	}

	log.Println("Server running on port", cfg.Port)

	r.Run(":" + cfg.Port)
}
