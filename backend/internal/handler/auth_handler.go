package handler

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"backend/internal/apperrors"
	"backend/internal/config"
	"backend/internal/model"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	authService    *service.AuthService
	cookieSecure   bool
	cookieSameSite http.SameSite
}

func NewAuthHandler(
	authService *service.AuthService,
	cfg config.Config,
) *AuthHandler {
	secure := cfg.CookieSecure
	if cfg.CookieSameSite == http.SameSiteNoneMode {
		secure = true
	}
	return &AuthHandler{
		authService:    authService,
		cookieSecure:   secure,
		cookieSameSite: cfg.CookieSameSite,
	}
}

// nama cookie sesi; Path=/ agar terbaca semua route API,
// MaxAge mengikuti umur token masing-masing
const (
	cookieAccess  = "ns_access"
	cookieRefresh = "ns_refresh"
)

// setAuthCookies menyimpan pasangan token ke cookie HttpOnly (tidak bisa
// dibaca JS, kebal XSS pencuri token) dan tetap mengembalikan JSON yang sama
// untuk kompatibilitas klien non-browser
func (h *AuthHandler) setAuthCookies(c *gin.Context, access, refresh string) {
	c.SetSameSite(h.cookieSameSite)
	c.SetCookie(cookieAccess, access, 24*60*60, "/", "", h.cookieSecure, true)
	c.SetCookie(cookieRefresh, refresh, 30*24*60*60, "/", "", h.cookieSecure, true)
}

func (h *AuthHandler) clearAuthCookies(c *gin.Context) {
	c.SetSameSite(h.cookieSameSite)
	c.SetCookie(cookieAccess, "", -1, "/", "", h.cookieSecure, true)
	c.SetCookie(cookieRefresh, "", -1, "/", "", h.cookieSecure, true)
}

// refreshFromRequest mengambil refresh token dari body (klien non-browser)
// atau cookie (browser); body diutamakan
func refreshFromRequest(c *gin.Context, bodyToken string) string {
	if bodyToken != "" {
		return bodyToken
	}
	if v, err := c.Cookie(cookieRefresh); err == nil && v != "" {
		return v
	}
	return ""
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

	h.setAuthCookies(c, response.AccessToken, response.RefreshToken)
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

	response, err := h.authService.Refresh(c.Request.Context(), refreshFromRequest(c, req.RefreshToken))
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

	h.setAuthCookies(c, response.AccessToken, response.RefreshToken)
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
	return []string{"Invalid request body"}
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

	c.SetSameSite(h.cookieSameSite)
	c.SetCookie(
		"oauth_state",
		state,
		600,
		"/",
		"",
		h.cookieSecure,
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
	c.SetSameSite(h.cookieSameSite)
	c.SetCookie("oauth_state", "", -1, "/", "", h.cookieSecure, true)

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

	// token TIDAK dilewatkan via URL (bocor ke history/referrer/log);
	// sesi langsung disimpan di cookie HttpOnly lalu redirect bersih
	h.setAuthCookies(c, token.AccessToken, token.RefreshToken)
	c.Redirect(http.StatusFound, frontendURL+"/auth/callback")
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// token boleh dari header Bearer (klien non-browser) atau cookie ns_access
	// (browser). Karena sesi browser berbasis cookie, logout tidak boleh
	// mewajibkan header Authorization.
	tokenString := ""
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && parts[0] == "Bearer" && parts[1] != "" {
			tokenString = parts[1]
		}
	}
	if tokenString == "" {
		if v, err := c.Cookie(cookieAccess); err == nil && v != "" {
			tokenString = v
		}
	}

	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	_ = c.ShouldBindJSON(&body)

	// selalu bersihkan cookie sesi walau token tidak ada/kadaluarsa, supaya
	// user benar-benar keluar dan tidak terjebak redirect balik ke dashboard
	if tokenString == "" {
		h.clearAuthCookies(c)
		c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
		return
	}

	if err := h.authService.Logout(c.Request.Context(), tokenString, refreshFromRequest(c, body.RefreshToken)); err != nil {
		switch {
		case errors.Is(err, apperrors.ErrInvalidToken):
			// token sudah tidak valid: tetap anggap logout sukses + bersihkan cookie
			h.clearAuthCookies(c)
			c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
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

	h.clearAuthCookies(c)
	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}
