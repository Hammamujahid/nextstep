package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// CORS mengizinkan frontend (browser) memanggil API dari origin berbeda.
// Tanpa ini, fetch dari http://localhost:3000 ke API :8080 diblokir browser.
// Hanya origin yang ada di allowlist yang di-echo; origin lain (termasuk
// "null") tidak mendapat header Allow-Origin sehingga browser menolaknya.
// Sesi browser memakai cookie HttpOnly (ns_access/ns_refresh), jadi
// Allow-Credentials: true dikirim bersama origin eksplisit (tidak pernah "*").
// Perlindungan CSRF mengandalkan SameSite=Lax pada cookie sesi: fetch
// cross-site dari origin asing tidak membawa cookie. jadi tidak
// perlu Access-Control-Allow-Credentials.
func CORS(allowedOrigins []string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, o := range allowedOrigins {
		if o = normalizeOrigin(o); o != "" {
			allowed[o] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		// selalu Vary: Origin agar cache (CDN/proxy) tidak mencampur
		// respons antar origin yang berbeda
		c.Header("Vary", "Origin")

		origin := normalizeOrigin(c.Request.Header.Get("Origin"))
		if _, ok := allowed[origin]; ok {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// normalizeOrigin menyeragamkan origin agar "https://app.com/" di config
// tetap cocok dengan Origin header browser ("https://app.com").
func normalizeOrigin(o string) string {
	return strings.TrimSuffix(strings.TrimSpace(o), "/")
}
