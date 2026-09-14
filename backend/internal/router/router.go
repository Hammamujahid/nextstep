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
	jwtService *service.JWTService,
	blacklistRepo *repository.TokenBlacklistRepository,
	allowedOrigins []string,
) *gin.Engine {
	router := gin.Default()
	router.Use(middleware.CORS(allowedOrigins))

	api := router.Group("/api/v1")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
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
		protected.GET("/me", userHandler.Me)
	}

	return router
}
