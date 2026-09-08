package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"backend/internal/config"
	"backend/internal/database"
)

func main() {
	cfg := config.Load()

	db := database.NewPostgresPool(cfg)
	defer db.Close()

	router := gin.Default()

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	log.Println("Server running on port", cfg.Port)

	router.Run(":" + cfg.Port)
}