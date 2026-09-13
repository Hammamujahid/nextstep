package router

import (
	"github.com/gin-gonic/gin"

	"backend/internal/handler"
)

func New(authHandler *handler.AuthHandler) *gin.Engine {
	router := gin.Default()

	api := router.Group("/api/v1")

	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	return router
}
