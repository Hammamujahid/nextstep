package apperrors

import "errors"

var (
	ErrEmailAlreadyExists     = errors.New("email already exists")
	ErrUsernameAlreadyExists  = errors.New("username already exists")
	ErrInvalidCredentials     = errors.New("invalid email or password")
	ErrUserNotFound           = errors.New("user not found")
	ErrDatabase               = errors.New("database error")
	ErrInvalidToken           = errors.New("invalid or expired token")
	ErrTokenRevoked           = errors.New("token has been revoked")
	ErrOAuthFailed            = errors.New("google authentication failed")
	ErrGoogleEmailNotVerified = errors.New("google email not verified")
	ErrForbidden              = errors.New("forbidden")
	ErrNotMember              = errors.New("not a workspace member")
	ErrAlreadyInvited         = errors.New("email already invited")
)
