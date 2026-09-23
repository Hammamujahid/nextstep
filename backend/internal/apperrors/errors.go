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
	ErrNotFound               = errors.New("resource not found")
	ErrInvalidPriority        = errors.New("invalid priority")
	ErrInvalidAssignee        = errors.New("assignee must be a workspace member with access to this resource")
	ErrCannotRemoveSelf       = errors.New("cannot remove yourself from workspace")
	ErrLastAdmin              = errors.New("cannot remove the last admin")
	ErrCannotEditSelf         = errors.New("cannot change your own permissions")
	ErrTargetIsAdmin          = errors.New("cannot change permissions of an admin")
)
