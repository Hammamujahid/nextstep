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

	jwtService := service.NewJWTService(
		cfg.JWTSECRET,
	)

	authService := service.NewAuthService(
		userRepository,
		jwtService,
	)

	authHandler := handler.NewAuthHandler(
		authService,
	)

	r := router.New(authHandler)

	log.Println("Server running on port", cfg.Port)

	r.Run(":" + cfg.Port)
}