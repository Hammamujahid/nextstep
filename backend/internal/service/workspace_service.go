package service

import (
	"context"
	"strings"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/repository"
)

type WorkspaceService struct {
	workspaceRepository  *repository.WorkspaceRepository
	userRepository       *repository.UserRepository
	permissionRepository *repository.PermissionRepository
}

func NewWorkspaceService(
	workspaceRepository *repository.WorkspaceRepository,
	userRepository *repository.UserRepository,
	permissionRepository *repository.PermissionRepository,
) *WorkspaceService {
	return &WorkspaceService{
		workspaceRepository:  workspaceRepository,
		userRepository:       userRepository,
		permissionRepository: permissionRepository,
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
	perms *model.InvitePermissions,
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
		WorkspaceId:              workspaceID,
		Email:                    email,
		Status:                   "pending",
		ProjectPermission:        normalizePermission(permissionOrDefault(perms, "project")),
		TaskPermission:           normalizePermission(permissionOrDefault(perms, "task")),
		GoalPermission:           normalizePermission(permissionOrDefault(perms, "goal")),
		JobApplicationPermission: normalizePermission(permissionOrDefault(perms, "job_application")),
	}
	if err := s.workspaceRepository.CreateInvitation(ctx, invitation); err != nil {
		return nil, err
	}

	return invitation, nil
}

// GetMyPermissions mengembalikan role dan permission keempat resource milik user login.
func (s *WorkspaceService) GetMyPermissions(
	ctx context.Context,
	workspaceID int,
	userID int,
) (string, map[string]string, error) {
	return s.permissionRepository.GetAllPermissions(ctx, workspaceID, userID)
}

// CancelInvitation menghapus undangan pending. Hanya admin workspace.
func (s *WorkspaceService) CancelInvitation(
	ctx context.Context,
	workspaceID int,
	userID int,
	invitationID int,
) error {
	role, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if role != "admin" {
		return apperrors.ErrForbidden
	}
	inv, err := s.workspaceRepository.FindInvitationByID(ctx, invitationID)
	if err != nil {
		return err
	}
	if inv.WorkspaceId != workspaceID {
		return apperrors.ErrNotFound
	}
	return s.workspaceRepository.DeleteInvitation(ctx, workspaceID, invitationID)
}

// SelectWorkspace mencatat workspace yang sedang dibuka user.
// Hanya anggota workspace yang boleh memilihnya.
func (s *WorkspaceService) SelectWorkspace(
	ctx context.Context,
	workspaceID int,
	userID int,
) error {
	if _, err := s.workspaceRepository.GetRole(ctx, workspaceID, userID); err != nil {
		return err
	}
	return s.userRepository.SetActiveWorkspace(ctx, userID, workspaceID)
}

// ListMyInvitations mengembalikan undangan pending yang ditujukan ke email user login.
func (s *WorkspaceService) ListMyInvitations(
	ctx context.Context,
	userID int,
) ([]model.WorkspaceInvitationWithWorkspace, error) {
	user, err := s.userRepository.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.workspaceRepository.ListPendingInvitationsByEmail(ctx, user.Email)
}

// AcceptInvitation menerima undangan: user menjadi anggota dengan member_role 'member'
// plus 4 baris permission sesuai undangan. Mengembalikan workspace_id.
func (s *WorkspaceService) AcceptInvitation(
	ctx context.Context,
	userID int,
	invitationID int,
) (int, error) {
	user, err := s.userRepository.FindByID(ctx, userID)
	if err != nil {
		return 0, err
	}
	inv, err := s.workspaceRepository.FindInvitationByID(ctx, invitationID)
	if err != nil {
		return 0, err
	}
	if !strings.EqualFold(inv.Email, user.Email) {
		return 0, apperrors.ErrForbidden
	}
	// kalau ternyata sudah jadi anggota (mis. diundang ulang jalur lain), cukup tutup undangan
	if role, err := s.workspaceRepository.GetRole(ctx, inv.WorkspaceId, userID); err == nil && role != "" {
		_ = s.workspaceRepository.SetInvitationStatus(ctx, invitationID, "accepted")
		return inv.WorkspaceId, nil
	}
	if _, err := s.workspaceRepository.AcceptInvitationTx(ctx, inv, userID); err != nil {
		return 0, err
	}
	return inv.WorkspaceId, nil
}

// DeclineInvitation menolak undangan milik user login.
func (s *WorkspaceService) DeclineInvitation(
	ctx context.Context,
	userID int,
	invitationID int,
) error {
	user, err := s.userRepository.FindByID(ctx, userID)
	if err != nil {
		return err
	}
	inv, err := s.workspaceRepository.FindInvitationByID(ctx, invitationID)
	if err != nil {
		return err
	}
	if !strings.EqualFold(inv.Email, user.Email) {
		return apperrors.ErrForbidden
	}
	return s.workspaceRepository.SetInvitationStatus(ctx, invitationID, "declined")
}

func permissionOrDefault(perms *model.InvitePermissions, resource string) string {
	if perms == nil {
		return "viewer"
	}
	switch resource {
	case "project":
		return perms.Project
	case "task":
		return perms.Task
	case "goal":
		return perms.Goal
	case "job_application":
		return perms.JobApplication
	default:
		return "viewer"
	}
}

func normalizePermission(p string) string {
	switch p {
	case "none", "viewer", "editor":
		return p
	default:
		return "viewer"
	}
}
