package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// bucket menghitung request satu key dalam satu window berjalan.
type bucket struct {
	count int
	reset time.Time
}

// Limiter adalah fixed-window rate limiter per IP (in-memory).
// Cukup untuk satu instance server; jangan dipakai sebagai satu-satunya
// pertahanan bila nanti ada banyak replica (pindah ke Redis).
type Limiter struct {
	mu      sync.Mutex
	buckets map[string]*bucket
	limit   int
	window  time.Duration
}

// RateLimit membatasi tiap IP hingga limit request per window.
// Preflight OPTIONS tidak dihitung. Melewati batas -> 429 + header Retry-After.
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	l := &Limiter{
		buckets: make(map[string]*bucket),
		limit:   limit,
		window:  window,
	}
	go l.sweep()

	return func(c *gin.Context) {
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}
		// tanpa trusted proxy, ClientIP = RemoteAddr (tidak bisa dipalsukan via header)
		key := c.ClientIP()
		now := time.Now()

		l.mu.Lock()
		b, ok := l.buckets[key]
		if !ok || !now.Before(b.reset) {
			b = &bucket{reset: now.Add(window)}
			l.buckets[key] = b
		}
		b.count++
		count, reset := b.count, b.reset
		l.mu.Unlock()

		if count > limit {
			retry := int(time.Until(reset).Seconds()) + 1
			if retry < 1 {
				retry = 1
			}
			c.Header("Retry-After", strconv.Itoa(retry))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"message": "Too many requests, please try again later",
			})
			return
		}
		c.Next()
	}
}

// sweep membuang bucket kedaluwarsa agar memori tidak tumbuh tanpa batas.
func (l *Limiter) sweep() {
	t := time.NewTicker(l.window)
	defer t.Stop()
	for range t.C {
		now := time.Now()
		l.mu.Lock()
		for k, b := range l.buckets {
			if !now.Before(b.reset) {
				delete(l.buckets, k)
			}
		}
		l.mu.Unlock()
	}
}
