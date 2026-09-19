package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	// AccessTokenTTL umur access token: cukup pendek, diperpanjang diam-diam via refresh.
	AccessTokenTTL = 24 * time.Hour
	// RefreshTokenTTL umur sesi persistent login: 30 hari sejak login terakhir.
	RefreshTokenTTL = 30 * 24 * time.Hour
)

type AuthService struct {
	userRepository      *repository.UserRepository
	blacklistRepository *repository.TokenBlacklistRepository
	refreshRepository   *repository.RefreshTokenRepository
	jwtService          *JWTService
	google              *GoogleOAuth
	frontendURL         string
}

func NewAuthService(
	userRepository *repository.UserRepository,
	blacklistRepository *repository.TokenBlacklistRepository,
	refreshRepository *repository.RefreshTokenRepository,
	jwtService *JWTService,
	google *GoogleOAuth,
	frontendURL string,
) *AuthService {
	return &AuthService{
		userRepository:      userRepository,
		blacklistRepository: blacklistRepository,
		refreshRepository:   refreshRepository,
		jwtService:          jwtService,
		google:              google,
		frontendURL:         frontendURL,
	}
}

func (s *AuthService) Register(
	ctx context.Context,
	req model.RegisterRequest,
) error {
	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return err
	}

	hash := string(passwordHash)
	user := &model.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: &hash,
	}

	return s.userRepository.Create(ctx, user)
}

func (s *AuthService) Login(
	ctx context.Context,
	req model.LoginRequest,
) (*model.LoginResponse, error) {
	user, err := s.userRepository.FindByEmail(
		ctx,
		req.Email,
	)
	if err != nil {
		if errors.Is(err, apperrors.ErrUserNotFound) {
			return nil, apperrors.ErrInvalidCredentials
		}
		return nil, err
	}

	// Akun yang daftar via Google tidak punya password.
	if user.PasswordHash == nil {
		return nil, apperrors.ErrInvalidCredentials
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(*user.PasswordHash),
		[]byte(req.Password),
	)
	if err != nil {
		return nil, apperrors.ErrInvalidCredentials
	}

	token, err := s.jwtService.GenerateToken(user.ID)
	if err != nil {
		return nil, err
	}

	refresh, err := s.issueRefreshToken(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	return s.buildLoginResponse(token, refresh), nil
}

func (s *AuthService) buildLoginResponse(token, refresh string) *model.LoginResponse {
	return &model.LoginResponse{
		AccessToken:  token,
		RefreshToken: refresh,
		ExpiresIn:    int(AccessTokenTTL.Seconds()),
	}
}

// issueRefreshToken membuat opaque refresh token baru dan menyimpannya (hash only).
func (s *AuthService) issueRefreshToken(
	ctx context.Context,
	userID int,
) (string, error) {
	raw, err := GenerateSecureToken()
	if err != nil {
		return "", err
	}
	if err := s.refreshRepository.Create(
		ctx,
		userID,
		HashToken(raw),
		time.Now().Add(RefreshTokenTTL),
	); err != nil {
		return "", err
	}
	return raw, nil
}

// Refresh menukar refresh token yang valid dengan pasangan token baru (rotasi:
// refresh token lama langsung dicabut sehingga tidak bisa dipakai ulang).
func (s *AuthService) Refresh(
	ctx context.Context,
	refreshToken string,
) (*model.LoginResponse, error) {
	stored, err := s.refreshRepository.FindByHash(ctx, HashToken(refreshToken))
	if err != nil {
		return nil, err
	}
	if stored.RevokedAt != nil || time.Now().After(stored.ExpiresAt) {
		return nil, apperrors.ErrInvalidToken
	}

	if err := s.refreshRepository.RevokeByHash(ctx, HashToken(refreshToken)); err != nil {
		return nil, err
	}

	token, err := s.jwtService.GenerateToken(stored.UserID)
	if err != nil {
		return nil, err
	}
	refresh, err := s.issueRefreshToken(ctx, stored.UserID)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{
		AccessToken:  token,
		RefreshToken: refresh,
		ExpiresIn:    int(AccessTokenTTL.Seconds()),
	}, nil
}

func (s *AuthService) Logout(
	ctx context.Context,
	tokenString string,
	refreshToken string,
) error {
	token, err := s.jwtService.ValidateToken(tokenString)
	if err != nil || !token.Valid {
		return apperrors.ErrInvalidToken
	}

	expiresAt, err := s.jwtService.GetExpiry(token)
	if err != nil {
		return apperrors.ErrInvalidToken
	}

	tokenHash := HashToken(tokenString)

	if err := s.blacklistRepository.Create(ctx, tokenHash, expiresAt); err != nil {
		return err
	}

	// cabut refresh token bila dikirim; kalau tidak, cabut semua milik user
	// agar tidak ada sesi persistent yang tertinggal
	if refreshToken != "" {
		if err := s.refreshRepository.RevokeByHash(ctx, HashToken(refreshToken)); err != nil {
			return err
		}
	} else if userID, err := userIDFromToken(token); err == nil {
		if err := s.refreshRepository.RevokeAllForUser(ctx, userID); err != nil {
			return err
		}
	}

	return nil
}

func userIDFromToken(token *jwt.Token) (int, error) {
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, apperrors.ErrInvalidToken
	}
	switch v := claims["sub"].(type) {
	case float64:
		return int(v), nil
	case int:
		return v, nil
	default:
		return 0, apperrors.ErrInvalidToken
	}
}

func (s *AuthService) FrontendURL() string {
	return s.frontendURL
}

func (s *AuthService) GoogleAuthURL(state string) string {
	return s.google.AuthCodeURL(state)
}

// HandleGoogleCallback menukar code Google menjadi pasangan token NextStep.
// Alur: code -> access token -> userinfo -> cari user by google_id,
// kalau tidak ada cari by email (link akun), kalau tidak ada buat baru.
func (s *AuthService) HandleGoogleCallback(
	ctx context.Context,
	code string,
) (*model.LoginResponse, error) {
	accessToken, err := s.google.ExchangeCode(ctx, code)
	if err != nil {
		return nil, apperrors.ErrOAuthFailed
	}

	info, err := s.google.FetchUserinfo(ctx, accessToken)
	if err != nil {
		return nil, apperrors.ErrOAuthFailed
	}

	if !info.VerifiedEmail {
		return nil, apperrors.ErrGoogleEmailNotVerified
	}

	user, err := s.userRepository.FindByGoogleID(ctx, info.ID)
	if err != nil && !errors.Is(err, apperrors.ErrUserNotFound) {
		return nil, err
	}
	if user != nil {
		return s.issueLoginResponse(ctx, user.ID)
	}

	user, err = s.userRepository.FindByEmail(ctx, info.Email)
	if err != nil && !errors.Is(err, apperrors.ErrUserNotFound) {
		return nil, err
	}
	if user != nil {
		var photo *string
		if info.Picture != "" {
			photo = &info.Picture
		}
		if err := s.userRepository.LinkGoogleID(ctx, user.ID, info.ID, photo); err != nil {
			return nil, err
		}
		return s.issueLoginResponse(ctx, user.ID)
	}

	created, err := s.createGoogleUser(ctx, info)
	if err != nil {
		return nil, err
	}
	return s.issueLoginResponse(ctx, created.ID)
}

// issueLoginResponse menerbitkan pasangan access + refresh token untuk user.
func (s *AuthService) issueLoginResponse(
	ctx context.Context,
	userID int,
) (*model.LoginResponse, error) {
	token, err := s.jwtService.GenerateToken(userID)
	if err != nil {
		return nil, err
	}
	refresh, err := s.issueRefreshToken(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.buildLoginResponse(token, refresh), nil
}

func (s *AuthService) createGoogleUser(
	ctx context.Context,
	info *GoogleUserinfo,
) (*model.User, error) {
	base := sanitizeUsername(info.Email)

	for i := 0; i < 5; i++ {
		username := base
		if i > 0 {
			suffix, err := GenerateSecureToken()
			if err != nil {
				return nil, err
			}
			username = fmt.Sprintf("%s_%s", base, suffix[:6])
		}

		user := &model.User{
			Username: username,
			Email:    info.Email,
		}
		if info.Picture != "" {
			photo := info.Picture
			user.PhotoProfile = &photo
		}
		googleID := info.ID
		user.GoogleID = &googleID

		err := s.userRepository.Create(ctx, user)
		if err == nil {
			return user, nil
		}
		if errors.Is(err, apperrors.ErrEmailAlreadyExists) {
			return nil, err
		}
		if !errors.Is(err, apperrors.ErrUsernameAlreadyExists) {
			return nil, err
		}
	}

	return nil, apperrors.ErrDatabase
}

// sanitizeUsername membuat username aman dari prefix email:
// "Andi.Pratama@gmail.com" -> "andipratama".
func sanitizeUsername(email string) string {
	base := email
	if at := strings.Index(base, "@"); at > 0 {
		base = base[:at]
	}

	var b strings.Builder
	for _, r := range strings.ToLower(base) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '_' {
			b.WriteRune(r)
		}
	}

	username := b.String()
	if len(username) < 3 {
		username = "user_" + username
	}
	if len(username) > 40 {
		username = username[:40]
	}
	return username
}
