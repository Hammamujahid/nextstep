package service

import (
	"sync"
)

// EventBus untuk SSE per workspace. Satu arah: server -> client.
type EventBus struct {
	mu          sync.RWMutex
	subscribers map[int]map[chan []byte]bool // workspaceID -> set of channels
}

func NewEventBus() *EventBus {
	return &EventBus{
		subscribers: make(map[int]map[chan []byte]bool),
	}
}

// Subscribe mendaftarkan channel untuk workspace. Return channel dan unsubscribe func.
func (b *EventBus) Subscribe(workspaceID int) (chan []byte, func()) {
	ch := make(chan []byte, 16)
	b.mu.Lock()
	if b.subscribers[workspaceID] == nil {
		b.subscribers[workspaceID] = make(map[chan []byte]bool)
	}
	b.subscribers[workspaceID][ch] = true
	b.mu.Unlock()

	unsub := func() {
		b.mu.Lock()
		delete(b.subscribers[workspaceID], ch)
		if len(b.subscribers[workspaceID]) == 0 {
			delete(b.subscribers, workspaceID)
		}
		b.mu.Unlock()
		close(ch)
	}
	return ch, unsub
}

// Publish mengirim data ke semua subscriber workspace. Non-blocking, drop jika channel penuh.
func (b *EventBus) Publish(workspaceID int, data []byte) {
	b.mu.RLock()
	subs := b.subscribers[workspaceID]
	b.mu.RUnlock()
	for ch := range subs {
		select {
		case ch <- data:
		default:
		}
	}
}
