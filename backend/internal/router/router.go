package router

import (
	"github.com/gin-gonic/gin"

	"backend/internal/handler"
	"backend/internal/middleware"
	"backend/internal/service"
)

func New(
	authHandler *handler.AuthHandler,
	jwtService *service.JWTService,
) *gin.Engine {
	router := gin.Default()

	api := router.Group("/api/v1")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(jwtService))
	{
		protected.POST("/auth/logout", authHandler.Logout)
		protected.GET("/me", func(c *gin.Context) {
			userID, _ := c.Get("userID")
			c.JSON(200, gin.H{"user_id": userID})
		})
	}

	return router
}
