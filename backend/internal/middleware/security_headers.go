package middleware

import (
	"github.com/gin-gonic/gin"
)

// SecurityHeaders memasang header keamanan di setiap respons API.
// API hanya mengembalikan JSON/SSE (tidak ada HTML yang dirender browser),
// jadi kebijakannya bisa ketat:
// - HSTS: paksa HTTPS (diabaikan browser saat masih http/dev)
// - nosniff: cegah browser menebak tipe konten
// - DENY + frame-ancestors: API tidak boleh di-frame (anti clickjacking)
// - CSP default-src 'none': tidak ada subresource yang boleh dimuat
// - Referrer-Policy: jangan bocorkan path/query ke origin lain
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'deny'")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	}
}
