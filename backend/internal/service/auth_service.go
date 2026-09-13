package service

import (
    "context"

    "backend/internal/model"
    "backend/internal/repository"

    "golang.org/x/crypto/bcrypt"
)

type AuthService struct {
    userRepository *repository.UserRepository
	jwtService		*JWTService
}

func NewAuthService(
    userRepository *repository.UserRepository,
	jwtService *JWTService,
) *AuthService {
    return &AuthService{
        userRepository: userRepository,
		jwtService: jwtService,
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

    user := &model.User{
        Username:    req.Username,
        Email:       req.Email,
        PasswordHash: string(passwordHash),
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
        return nil, err
    }

    err = bcrypt.CompareHashAndPassword(
        []byte(user.PasswordHash),
        []byte(req.Password),
    )

    if err != nil {
        return nil, err
    }

	token, err := s.jwtService.GenerateToken(user.ID)

	if err != nil {
		return nil, err
	}

    return &model.LoginResponse{
		AccessToken: token,
	}, nil
}