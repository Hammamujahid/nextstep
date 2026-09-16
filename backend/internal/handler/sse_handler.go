package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"backend/internal/apperrors"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type SSEHandler struct {
	eventBus            *service.EventBus
	workspaceRepository *repository.WorkspaceRepository
}

func NewSSEHandler(eventBus *service.EventBus, workspaceRepository *repository.WorkspaceRepository) *SSEHandler {
	return &SSEHandler{
		eventBus:            eventBus,
		workspaceRepository: workspaceRepository,
	}
}

// Handle SSE untuk workspace. Satu arah: server -> client.
// Client: new EventSource(`/api/v1/workspaces/${id}/events?token=...`)
func (h *SSEHandler) Handle(c *gin.Context) {
	workspaceID, err := workspaceIDParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid workspace id"})
		return
	}
	userID := c.GetInt("userID")

	// cek member
	if _, err := h.workspaceRepository.GetRole(c.Request.Context(), workspaceID, userID); err != nil {
		if errors.Is(err, apperrors.ErrNotMember) {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this workspace"})
			return
		}
		if errors.Is(err, apperrors.ErrDatabase) {
			log.Println("sse get role error:", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to verify membership"})
		return
	}

	// SSE headers
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")

	ch, unsub := h.eventBus.Subscribe(workspaceID)
	defer unsub()

	// initial comment to establish connection
	fmt.Fprintf(c.Writer, ": connected\n\n")
	c.Writer.Flush()

	// ping ticker optional, but we just wait for events or client disconnect
	notify := c.Request.Context().Done()
	for {
		select {
		case <-notify:
			return
		case data, ok := <-ch:
			if !ok {
				return
			}
			// data sudah JSON string dengan event type di dalamnya, kita kirim sebagai data
			fmt.Fprintf(c.Writer, "data: %s\n\n", string(data))
			c.Writer.Flush()
		}
	}
}

// Helper untuk publish progress update setelah toggle/create
func PublishGoalProgress(eventBus *service.EventBus, workspaceID int, goal interface{}) {
	b, _ := json.Marshal(map[string]interface{}{
		"type": "goal_progress",
		"data": goal,
	})
	eventBus.Publish(workspaceID, b)
}

func PublishGoalsRefresh(eventBus *service.EventBus, workspaceID int) {
	b, _ := json.Marshal(map[string]interface{}{
		"type": "goals_refresh",
		"data": map[string]int{"workspace_id": workspaceID},
	})
	eventBus.Publish(workspaceID, b)
}
