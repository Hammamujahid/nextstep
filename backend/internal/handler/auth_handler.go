package handler

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req model.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation failed",
			"details": validationMessages(err),
		})
		return
	}

	err := h.authService.Register(
		c.Request.Context(),
		req,
	)

	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrEmailAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{
				"message": "Email already exists",
			})
		case errors.Is(err, apperrors.ErrUsernameAlreadyExists):
			c.JSON(http.StatusConflict, gin.H{
				"message": "Username already exists",
			})
		case errors.Is(err, apperrors.ErrDatabase):
			log.Println("register database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to register user, please try again later",
			})
		default:
			log.Println("register error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to register user, please try again later",
			})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation failed",
			"details": validationMessages(err),
		})
		return
	}

	response, err := h.authService.Login(
		c.Request.Context(),
		req,
	)

	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrInvalidCredentials):
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Invalid email or password",
			})
		case errors.Is(err, apperrors.ErrDatabase):
			log.Println("login database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Login failed, please try again later",
			})
		default:
			log.Println("login error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Login failed, please try again later",
			})
		}
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req model.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation failed",
			"details": validationMessages(err),
		})
		return
	}

	response, err := h.authService.Refresh(c.Request.Context(), req.RefreshToken)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrInvalidToken):
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Invalid or expired session, please log in again",
			})
		case errors.Is(err, apperrors.ErrDatabase):
			log.Println("refresh database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to refresh session, please try again later",
			})
		default:
			log.Println("refresh error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to refresh session, please try again later",
			})
		}
		return
	}

	c.JSON(http.StatusOK, response)
}

func validationMessages(err error) []string {
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		msgs := make([]string, 0, len(ve))
		for _, fe := range ve {
			msgs = append(msgs, fe.Field()+" failed on '"+fe.Tag()+"' validation")
		}
		return msgs
	}
	return []string{err.Error()}
}

// GoogleLogin memulai Authorization Code Flow: buat state anti-CSRF,
// simpan di cookie HttpOnly, lalu redirect ke consent screen Google.
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	state, err := service.GenerateSecureToken()
	if err != nil {
		log.Println("google login state error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to start Google login, please try again later",
		})
		return
	}

	c.SetCookie(
		"oauth_state",
		state,
		600,
		"/",
		"",
		false,
		true,
	)
	c.Redirect(http.StatusFound, h.authService.GoogleAuthURL(state))
}

// GoogleCallback menerima code dari Google, menukarnya menjadi JWT
// NextStep, lalu redirect ke frontend dengan token.
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	frontendURL := h.authService.FrontendURL()
	fail := func(reason string) {
		c.Redirect(http.StatusFound, frontendURL+"/login?error="+reason)
	}

	state := c.Query("state")
	cookieState, err := c.Cookie("oauth_state")
	if err != nil || state == "" || state != cookieState {
		fail("oauth_state")
		return
	}
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	code := c.Query("code")
	if code == "" {
		if c.Query("error") != "" {
			log.Println("google oauth denied:", c.Query("error"))
		}
		fail("oauth_failed")
		return
	}

	token, err := h.authService.HandleGoogleCallback(c.Request.Context(), code)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrGoogleEmailNotVerified):
			fail("email_not_verified")
		default:
			log.Println("google callback error:", err)
			fail("oauth_failed")
		}
		return
	}

	c.Redirect(http.StatusFound, frontendURL+"/auth/callback?token="+token.AccessToken+"&refresh_token="+token.RefreshToken)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"message": "Authorization header format must be Bearer {token}",
		})
		return
	}

	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.ShouldBindJSON(&body)

	if err := h.authService.Logout(c.Request.Context(), parts[1], body.RefreshToken); err != nil {
		switch {
		case errors.Is(err, apperrors.ErrInvalidToken):
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Invalid or expired token",
			})
		case errors.Is(err, apperrors.ErrDatabase):
			log.Println("logout database error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to logout, please try again later",
			})
		default:
			log.Println("logout error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to logout, please try again later",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}
