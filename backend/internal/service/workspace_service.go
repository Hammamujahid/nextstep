package service

import (
	"context"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"
)

type WorkspaceService struct {
	workspaceRepository *repository.WorkspaceRepository
}

func NewWorkspaceService(
	workspaceRepository *repository.WorkspaceRepository,
) *WorkspaceService {
	return &WorkspaceService{
		workspaceRepository: workspaceRepository,
	}
}

func (s *WorkspaceService) ListMyWorkspaces(
	ctx context.Context,
	userID int,
) ([]model.WorkspaceWithRole, error) {
	return s.workspaceRepository.ListByUserID(ctx, userID)
}

func (s *WorkspaceService) CreateWorkspace(
	ctx context.Context,
	userID int,
	req model.CreateWorkspaceRequest,
) (*model.Workspace, error) {
	workspace := &model.Workspace{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := s.workspaceRepository.CreateWithAdminMember(
		ctx,
		workspace,
		userID,
	); err != nil {
		return nil, err
	}

	return workspace, nil
}

func (s *WorkspaceService) UpdateWorkspace(
	ctx context.Context,
	workspaceID int,
	userID int,
	req model.CreateWorkspaceRequest,
) (*model.Workspace, error) {
	role, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if role != "admin" {
		return nil, apperrors.ErrForbidden
	}

	return s.workspaceRepository.Update(ctx, workspaceID, req.Name, req.Description)
}

func (s *WorkspaceService) requireMember(
	ctx context.Context,
	workspaceID int,
	userID int,
) error {
	_, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID)
	return err
}

func (s *WorkspaceService) ListMembers(
	ctx context.Context,
	workspaceID int,
	userID int,
) ([]model.WorkspaceMemberWithUser, []model.WorkspaceInvitation, error) {
	if err := s.requireMember(ctx, workspaceID, userID); err != nil {
		return nil, nil, err
	}

	members, err := s.workspaceRepository.ListMembers(ctx, workspaceID)
	if err != nil {
		return nil, nil, err
	}

	invitations, err := s.workspaceRepository.ListInvitations(ctx, workspaceID)
	if err != nil {
		return nil, nil, err
	}

	return members, invitations, nil
}

func (s *WorkspaceService) InviteMember(
	ctx context.Context,
	workspaceID int,
	userID int,
	email string,
) (*model.WorkspaceInvitation, error) {
	role, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if role != "admin" {
		return nil, apperrors.ErrForbidden
	}

	isMember, err := s.workspaceRepository.IsUserMember(ctx, workspaceID, email)
	if err != nil {
		return nil, err
	}
	if isMember {
		return nil, apperrors.ErrAlreadyInvited
	}

	existing, err := s.workspaceRepository.FindPendingInvitation(ctx, workspaceID, email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, apperrors.ErrAlreadyInvited
	}

	invitation := &model.WorkspaceInvitation{
		WorkspaceId: workspaceID,
		Email:       email,
		Status:      "pending",
	}
	if err := s.workspaceRepository.CreateInvitation(ctx, invitation); err != nil {
		return nil, err
	}

	return invitation, nil
}
