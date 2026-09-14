package middleware

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"backend/internal/apperrors"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(
	jwtService *service.JWTService,
	blacklistRepo *repository.TokenBlacklistRepository,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Authorization header is required",
			})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Authorization header format must be Bearer {token}",
			})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := jwtService.ValidateToken(tokenString)
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		blacklisted, err := blacklistRepo.IsBlacklisted(
			c.Request.Context(),
			service.HashToken(tokenString),
		)
		if err != nil {
			if errors.Is(err, apperrors.ErrDatabase) {
				log.Println("blacklist check database error:", err)
			}
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to verify token, please try again later",
			})
			c.Abort()
			return
		}
		if blacklisted {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Token has been revoked",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Invalid token claims",
			})
			c.Abort()
			return
		}

		sub, ok := claims["sub"]
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "User ID not found in token",
			})
			c.Abort()
			return
		}

		var userID int
		switch v := sub.(type) {
		case float64:
			userID = int(v)
		case int:
			userID = v
		default:
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Invalid user ID type in token",
			})
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}
