package middleware

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"backend/internal/apperrors"
	"backend/internal/repository"

	"github.com/gin-gonic/gin"
)

// RequireResourcePermission menegakkan workspace_member_permissions untuk satu resource.
// Dipakai setelah AuthMiddleware (butuh userID di context).
// - admin: selalu lolos (full akses)
// - permission none: semua operasi ditolak
// - viewer: hanya baca (write=true ditolak)
// - editor: baca + tulis
func RequireResourcePermission(
	permissionRepo *repository.PermissionRepository,
	resource string,
	write bool,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		workspaceID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Invalid workspace id",
			})
			c.Abort()
			return
		}
		userID := c.GetInt("userID")

		role, perm, err := permissionRepo.GetMemberPermission(
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
			} else {
				log.Println("permission check database error:", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "Failed to verify permission, please try again later",
				})
			}
			c.Abort()
			return
		}
		if role == "admin" {
			c.Next()
			return
		}
		if perm == "none" || (write && perm != "editor") {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "You don't have access to this resource",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
