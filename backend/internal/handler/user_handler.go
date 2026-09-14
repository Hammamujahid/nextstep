package handler

import (
	"errors"
	"log"
	"net/http"

	"backend/internal/apperrors"
	"backend/internal/repository"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userRepository *repository.UserRepository
}

func NewUserHandler(
	userRepository *repository.UserRepository,
) *UserHandler {
	return &UserHandler{
		userRepository: userRepository,
	}
}

func (h *UserHandler) Me(c *gin.Context) {
	userID := c.GetInt("userID")

	user, err := h.userRepository.FindByID(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrUserNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "User not found",
			})
			return
		}
		log.Println("me error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to load profile, please try again later",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":       user.ID,
		"username":      user.Username,
		"email":         user.Email,
		"photo_profile": user.PhotoProfile,
	})
}
