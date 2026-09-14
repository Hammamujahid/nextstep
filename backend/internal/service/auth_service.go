package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepository      *repository.UserRepository
	blacklistRepository *repository.TokenBlacklistRepository
	jwtService          *JWTService
	google              *GoogleOAuth
	frontendURL         string
}

func NewAuthService(
	userRepository *repository.UserRepository,
	blacklistRepository *repository.TokenBlacklistRepository,
	jwtService *JWTService,
	google *GoogleOAuth,
	frontendURL string,
) *AuthService {
	return &AuthService{
		userRepository:      userRepository,
		blacklistRepository: blacklistRepository,
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

	return &model.LoginResponse{
		AccessToken: token,
	}, nil
}

func (s *AuthService) Logout(
	ctx context.Context,
	tokenString string,
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

	return s.blacklistRepository.Create(ctx, tokenHash, expiresAt)
}

func (s *AuthService) FrontendURL() string {
	return s.frontendURL
}

func (s *AuthService) GoogleAuthURL(state string) string {
	return s.google.AuthCodeURL(state)
}

// HandleGoogleCallback menukar code Google menjadi JWT NextStep.
// Alur: code -> access token -> userinfo -> cari user by google_id,
// kalau tidak ada cari by email (link akun), kalau tidak ada buat baru.
func (s *AuthService) HandleGoogleCallback(
	ctx context.Context,
	code string,
) (string, error) {
	accessToken, err := s.google.ExchangeCode(ctx, code)
	if err != nil {
		return "", apperrors.ErrOAuthFailed
	}

	info, err := s.google.FetchUserinfo(ctx, accessToken)
	if err != nil {
		return "", apperrors.ErrOAuthFailed
	}

	if !info.VerifiedEmail {
		return "", apperrors.ErrGoogleEmailNotVerified
	}

	user, err := s.userRepository.FindByGoogleID(ctx, info.ID)
	if err != nil && !errors.Is(err, apperrors.ErrUserNotFound) {
		return "", err
	}
	if user != nil {
		return s.jwtService.GenerateToken(user.ID)
	}

	user, err = s.userRepository.FindByEmail(ctx, info.Email)
	if err != nil && !errors.Is(err, apperrors.ErrUserNotFound) {
		return "", err
	}
	if user != nil {
		var photo *string
		if info.Picture != "" {
			photo = &info.Picture
		}
		if err := s.userRepository.LinkGoogleID(ctx, user.ID, info.ID, photo); err != nil {
			return "", err
		}
		return s.jwtService.GenerateToken(user.ID)
	}

	created, err := s.createGoogleUser(ctx, info)
	if err != nil {
		return "", err
	}
	return s.jwtService.GenerateToken(created.ID)
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
