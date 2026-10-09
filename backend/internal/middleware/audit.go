package middleware

import (
	"context"
	"log"
	"strconv"
	"strings"

	"backend/internal/repository"

	"github.com/gin-gonic/gin"
)

// AuditLogger mencatat semua request mutasi (POST/PUT/PATCH/DELETE) ke audit_logs:
// siapa (userID), di workspace mana, aksi apa, resource mana, status akhir, dari IP mana.
// GET/HEAD/OPTIONS dilewati agar tabel tidak dibanjiri request baca.
// Penulisan async (goroutine + context.Background) sehingga tidak pernah
// memperlambat respons; gagal simpan hanya tercatat di konsol.
func AuditLogger(repo *repository.AuditRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		switch c.Request.Method {
		case "GET", "HEAD", "OPTIONS":
			c.Next()
			return
		}

		c.Next()

		full := c.FullPath()
		if full == "" {
			return
		}
		action, resourceType, resourceKey := auditAction(full, c.Request.Method)
		if action == "" {
			return
		}

		entry := repository.AuditEntry{
			Action:    action,
			Status:    c.Writer.Status(),
			IPAddress: c.ClientIP(),
		}
		if wsID, err := strconv.Atoi(c.Param("id")); err == nil {
			entry.WorkspaceID = &wsID
		}
		if userID := c.GetInt("userID"); userID != 0 {
			entry.UserID = &userID
		}
		if resourceType != "" {
			entry.ResourceType = &resourceType
		}
		if resourceKey != "" {
			if resID, err := strconv.Atoi(c.Param(resourceKey)); err == nil {
				entry.ResourceID = &resID
			} else if resourceKey == "self" {
				if userID := c.GetInt("userID"); userID != 0 {
					entry.ResourceID = &userID
				}
			}
		}

		go func() {
			if err := repo.Create(context.Background(), entry); err != nil {
				log.Println("audit log error:", err)
			}
		}()
	}
}

// auditAction memetakan pola route gin ke (action, resourceType, namaParamID).
// resourceKey "self" berarti resource_id = userID (mis. PATCH /me).
func auditAction(full, method string) (string, string, string) {
	// toggle task punya pola sendiri (suffiks /toggle)
	if strings.HasSuffix(full, "/tasks/:taskId/toggle") {
		return "task.toggle", "task", "taskId"
	}
	switch full {
	case "/api/v1/auth/register":
		return "auth.register", "", ""
	case "/api/v1/auth/login":
		return "auth.login", "", ""
	case "/api/v1/auth/refresh":
		return "auth.refresh", "", ""
	case "/api/v1/auth/logout":
		return "auth.logout", "", ""
	case "/api/v1/auth/google/login":
		return "auth.google_login", "", ""
	case "/api/v1/auth/google/callback":
		return "auth.google_callback", "", ""
	case "/api/v1/workspaces":
		if method == "POST" {
			return "workspace.create", "workspace", ""
		}
	case "/api/v1/workspaces/:id":
		if method == "PUT" {
			return "workspace.update", "workspace", "id"
		}
	case "/api/v1/workspaces/:id/select":
		return "workspace.select", "workspace", "id"
	case "/api/v1/workspaces/:id/invite":
		return "member.invite", "invitation", ""
	case "/api/v1/workspaces/:id/members/:memberId":
		if method == "DELETE" {
			return "member.remove", "member", "memberId"
		}
		return "member.permission", "member", "memberId"
	case "/api/v1/workspaces/:id/invitations/:invitationId":
		return "invitation.cancel", "invitation", "invitationId"
	case "/api/v1/invitations/:id/accept":
		return "invitation.accept", "invitation", "id"
	case "/api/v1/invitations/:id/decline":
		return "invitation.decline", "invitation", "id"
	case "/api/v1/workspaces/:id/tasks":
		return "task.create", "task", ""
	case "/api/v1/workspaces/:id/tasks/:taskId":
		if method == "DELETE" {
			return "task.delete", "task", "taskId"
		}
		return "task.update", "task", "taskId"
	case "/api/v1/workspaces/:id/projects":
		return "project.create", "project", ""
	case "/api/v1/workspaces/:id/projects/:projectId":
		if method == "DELETE" {
			return "project.delete", "project", "projectId"
		}
		return "project.update", "project", "projectId"
	case "/api/v1/workspaces/:id/goals":
		return "goal.create", "goal", ""
	case "/api/v1/workspaces/:id/goals/:goalId":
		if method == "DELETE" {
			return "goal.delete", "goal", "goalId"
		}
		return "goal.update", "goal", "goalId"
	case "/api/v1/workspaces/:id/applications":
		return "application.create", "application", ""
	case "/api/v1/workspaces/:id/applications/:applicationId":
		if method == "DELETE" {
			return "application.delete", "application", "applicationId"
		}
		return "application.update", "application", "applicationId"
	case "/api/v1/me":
		return "profile.update", "user", "self"
	case "/api/v1/me/password":
		return "password.change", "user", "self"
	}
	return method + " " + full, "", ""
}
