package handler

import (
	"errors"
	"log"
	"net/http"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
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
		"user_id":             user.ID,
		"username":            user.Username,
		"email":               user.Email,
		"photo_profile":       user.PhotoProfile,
		"active_workspace_id": user.ActiveWorkspaceId,
	})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetInt("userID")

	var req model.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation failed",
			"details": validationMessages(err),
		})
		return
	}
	if req.Username == nil && req.Email == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Nothing to update",
		})
		return
	}

	user, err := h.userRepository.UpdateProfile(
		c.Request.Context(),
		userID,
		req.Username,
		req.Email,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrUserNotFound):
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "User not found",
			})
		case errors.Is(err, apperrors.ErrEmailAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{
				"message": "Email already exists",
			})
		case errors.Is(err, apperrors.ErrUsernameAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{
				"message": "Username already exists",
			})
		default:
			log.Println("update profile error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to update profile, please try again later",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":             "Profile updated successfully",
		"user_id":             user.ID,
		"username":            user.Username,
		"email":               user.Email,
		"photo_profile":       user.PhotoProfile,
		"active_workspace_id": user.ActiveWorkspaceId,
	})
}

// ChangePassword mengganti password milik sendiri. Wajib tahu password lama;
// akun yang daftar via Google (tanpa password) ditolak dengan pesan jelas.
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := c.GetInt("userID")

	var req model.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation failed",
			"details": validationMessages(err),
		})
		return
	}

	user, err := h.userRepository.FindByID(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, apperrors.ErrUserNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "User not found",
			})
			return
		}
		log.Println("change password lookup error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to change password, please try again later",
		})
		return
	}
	if user.PasswordHash == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": apperrors.ErrNoPasswordSet.Error(),
		})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": apperrors.ErrWrongCurrentPassword.Error(),
		})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Println("change password hash error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to change password, please try again later",
		})
		return
	}
	if err := h.userRepository.UpdatePassword(c.Request.Context(), userID, string(hash)); err != nil {
		if errors.Is(err, apperrors.ErrUserNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "User not found",
			})
			return
		}
		log.Println("change password update error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to change password, please try again later",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password changed successfully",
	})
}
