package handler

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"backend/internal/apperrors"
	"backend/internal/model"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

func workspaceIDParam(c *gin.Context) (int, error) {
	return strconv.Atoi(c.Param("id"))
}

type WorkspaceHandler struct {
	workspaceService *service.WorkspaceService
}

func NewWorkspaceHandler(
	workspaceService *service.WorkspaceService,
) *WorkspaceHandler {
	return &WorkspaceHandler{
		workspaceService: workspaceService,
	}
}

func (h *WorkspaceHandler) List(c *gin.Context) {
	userID := c.GetInt("userID")

	workspaces, err := h.workspaceService.ListMyWorkspaces(
		c.Request.Context(),
		userID,
	)
	if err != nil {
		log.Println("list workspaces error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to load workspaces, please try again later",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": workspaces,
	})
}

func (h *WorkspaceHandler) Create(c *gin.Context) {
	var req model.CreateWorkspaceRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation failed",
			"details": validationMessages(err),
		})
		return
	}

	userID := c.GetInt("userID")

	workspace, err := h.workspaceService.CreateWorkspace(
		c.Request.Context(),
		userID,
		req,
	)
	if err != nil {
		if errors.Is(err, apperrors.ErrDatabase) {
			log.Println("create workspace database error:", err)
		} else {
			log.Println("create workspace error:", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to create workspace, please try again later",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Workspace created successfully",
		"data":    workspace,
	})
}

func (h *WorkspaceHandler) Update(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid workspace id",
		})
		return
	}

	var req model.CreateWorkspaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation failed",
			"details": validationMessages(err),
		})
		return
	}

	userID := c.GetInt("userID")

	workspace, err := h.workspaceService.UpdateWorkspace(
		c.Request.Context(),
		workspaceID,
		userID,
		req,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrNotMember):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
		case errors.Is(err, apperrors.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "Only workspace admins can edit settings",
			})
		default:
			log.Println("update workspace error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to update workspace, please try again later",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Workspace updated successfully",
		"data":    workspace,
	})
}

func (h *WorkspaceHandler) ListMembers(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid workspace id",
		})
		return
	}

	userID := c.GetInt("userID")

	members, invitations, err := h.workspaceService.ListMembers(
		c.Request.Context(),
		workspaceID,
		userID,
	)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
			return
		}
		log.Println("list members error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to load members, please try again later",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"members":     members,
			"invitations": invitations,
		},
	})
}

func (h *WorkspaceHandler) ListAssignableMembers(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid workspace id",
		})
		return
	}

	resource := c.Query("resource")
	switch resource {
	case "project", "task", "goal", "job_application":
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid resource (project|task|goal|job_application)",
		})
		return
	}

	userID := c.GetInt("userID")

	members, err := h.workspaceService.ListAssignableMembers(
		c.Request.Context(),
		workspaceID,
		userID,
		resource,
	)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
			return
		}
		log.Println("list assignable members error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to load members, please try again later",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": members,
	})
}

func (h *WorkspaceHandler) Invite(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid workspace id",
		})
		return
	}

	var req model.InviteMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation failed",
			"details": validationMessages(err),
		})
		return
	}

	userID := c.GetInt("userID")

	invitation, err := h.workspaceService.InviteMember(
		c.Request.Context(),
		workspaceID,
		userID,
		req.Email,
		req.Permissions,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrNotMember):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
		case errors.Is(err, apperrors.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "Only workspace admins can invite members",
			})
		case errors.Is(err, apperrors.ErrAlreadyInvited):
			c.JSON(http.StatusConflict, gin.H{
				"message": "This email is already invited or a member",
			})
		default:
			log.Println("invite member error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to send invitation, please try again later",
			})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Invitation sent successfully",
		"data":    invitation,
	})
}

func (h *WorkspaceHandler) SelectWorkspace(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Invalid workspace id",
		})
		return
	}

	userID := c.GetInt("userID")

	if err := h.workspaceService.SelectWorkspace(
		c.Request.Context(),
		workspaceID,
		userID,
	); err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
			return
		}
		log.Println("select workspace error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to switch workspace, please try again later",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Workspace switched",
		"data":    gin.H{"workspace_id": workspaceID},
	})
}

func (h *WorkspaceHandler) CancelInvitation(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	invitationID, err := strconv.Atoi(c.Param("invitationId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid invitation id"})
		return
	}

	userID := c.GetInt("userID")

	if err := h.workspaceService.CancelInvitation(
		c.Request.Context(),
		workspaceID,
		userID,
		invitationID,
	); err != nil {
		switch {
		case errors.Is(err, apperrors.ErrNotMember):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
		case errors.Is(err, apperrors.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "Only workspace admins can cancel invitations",
			})
		case errors.Is(err, apperrors.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"message": "Invitation not found"})
		default:
			log.Println("cancel invitation error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to cancel invitation"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation cancelled"})
}

func (h *WorkspaceHandler) RemoveMember(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	memberID, err := strconv.Atoi(c.Param("memberId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid member id"})
		return
	}

	userID := c.GetInt("userID")

	if err := h.workspaceService.RemoveMember(
		c.Request.Context(),
		workspaceID,
		userID,
		memberID,
	); err != nil {
		switch {
		case errors.Is(err, apperrors.ErrNotMember):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
		case errors.Is(err, apperrors.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "Only workspace admins can remove members",
			})
		case errors.Is(err, apperrors.ErrCannotRemoveSelf):
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "You cannot remove yourself from the workspace",
			})
		case errors.Is(err, apperrors.ErrLastAdmin):
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "You cannot remove the last admin of the workspace",
			})
		case errors.Is(err, apperrors.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"message": "Member not found"})
		default:
			log.Println("remove member error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to remove member"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member removed"})
}

func (h *WorkspaceHandler) UpdateMemberPermission(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	memberID, err := strconv.Atoi(c.Param("memberId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid member id"})
		return
	}

	var req model.UpdateMemberPermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Validation failed",
			"details": validationMessages(err),
		})
		return
	}

	userID := c.GetInt("userID")

	if err := h.workspaceService.UpdateMemberPermission(
		c.Request.Context(),
		workspaceID,
		userID,
		memberID,
		req.Resource,
		req.Permission,
	); err != nil {
		switch {
		case errors.Is(err, apperrors.ErrNotMember):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
		case errors.Is(err, apperrors.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{
				"message": "Only workspace admins can change member permissions",
			})
		case errors.Is(err, apperrors.ErrCannotEditSelf):
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "You cannot change your own permissions",
			})
		case errors.Is(err, apperrors.ErrTargetIsAdmin):
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Cannot change permissions of an admin",
			})
		case errors.Is(err, apperrors.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"message": "Member not found"})
		default:
			log.Println("update member permission error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update permission"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permission updated"})
}

func (h *WorkspaceHandler) MyPermissions(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}

	userID := c.GetInt("userID")

	role, perms, err := h.workspaceService.GetMyPermissions(
		c.Request.Context(),
		workspaceID,
		userID,
	)
	if err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You are not a member of this workspace",
			})
			return
		}
		log.Println("get my permissions error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to load permissions",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"member_role": role,
			"permissions": perms,
		},
	})
}

func (h *WorkspaceHandler) MyInvitations(c *gin.Context) {
	userID := c.GetInt("userID")
	invitations, err := h.workspaceService.ListMyInvitations(
		c.Request.Context(),
		userID,
	)
	if err != nil {
		log.Println("list my invitations error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to load invitations",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": invitations,
	})
}

func (h *WorkspaceHandler) AcceptInvitation(c *gin.Context) {
	invitationID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid invitation id"})
		return
	}

	userID := c.GetInt("userID")

	workspaceID, err := h.workspaceService.AcceptInvitation(
		c.Request.Context(),
		userID,
		invitationID,
	)
	if err != nil {
		switch {
		case errors.Is(err, apperrors.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"message": "Invitation not found"})
		case errors.Is(err, apperrors.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{"message": "This invitation is not for you"})
		default:
			log.Println("accept invitation error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to accept invitation"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Invitation accepted",
		"data":    gin.H{"workspace_id": workspaceID},
	})
}

func (h *WorkspaceHandler) DeclineInvitation(c *gin.Context) {
	invitationID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid invitation id"})
		return
	}

	userID := c.GetInt("userID")

	if err := h.workspaceService.DeclineInvitation(
		c.Request.Context(),
		userID,
		invitationID,
	); err != nil {
		switch {
		case errors.Is(err, apperrors.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"message": "Invitation not found"})
		case errors.Is(err, apperrors.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{"message": "This invitation is not for you"})
		default:
			log.Println("decline invitation error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to decline invitation"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invitation declined"})
}
