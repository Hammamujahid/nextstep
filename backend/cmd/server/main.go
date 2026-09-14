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

	authHandler := handler.NewAuthHandler(
		authService,
	)
	workspaceHandler := handler.NewWorkspaceHandler(
		workspaceService,
	)
	userHandler := handler.NewUserHandler(
		userRepository,
	)

	r := router.New(
		authHandler,
		workspaceHandler,
		userHandler,
		jwtService,
		blacklistRepository,
		[]string{cfg.FrontendURL, "http://localhost:3000"},
	)

	log.Println("Server running on port", cfg.Port)

	r.Run(":" + cfg.Port)
}
