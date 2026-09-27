package config

import (
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	DBSSLMode          string
	Port               string
	JWTSECRET          string
	FrontendURL        string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	CookieSecure       bool
	CookieSameSite     http.SameSite
	AppEnv             string
	TrustedProxies     []string
}

func Load() Config {
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")
	_ = godotenv.Load()

	frontendURL := firstNonEmpty(os.Getenv("FRONTEND_URL"), "http://localhost:3000")
	return Config{
		DBHost:             os.Getenv("DB_HOST"),
		DBPort:             os.Getenv("DB_PORT"),
		DBUser:             os.Getenv("DB_USER"),
		DBPassword:         os.Getenv("DB_PASSWORD"),
		DBName:             os.Getenv("DB_NAME"),
		DBSSLMode:          os.Getenv("DB_SSLMODE"),
		Port:               os.Getenv("PORT"),
		JWTSECRET:          os.Getenv("JWT_SECRET"),
		FrontendURL:        frontendURL,
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL: firstNonEmpty(
			os.Getenv("GOOGLE_REDIRECT_URL"),
			"http://localhost:8080/api/v1/auth/google/callback",
		),
		CookieSecure:   cookieSecure(frontendURL),
		CookieSameSite: cookieSameSite(os.Getenv("COOKIE_SAMESITE")),
		AppEnv:         firstNonEmpty(os.Getenv("APP_ENV"), "development"),
		TrustedProxies: splitCSV(os.Getenv("TRUSTED_PROXIES")),
	}
}

// IsProduction true bila APP_ENV=production (release mode + guard ketat).
func (c Config) IsProduction() bool {
	return strings.EqualFold(strings.TrimSpace(c.AppEnv), "production")
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

// splitCSV memecah env comma-separated (mis. TRUSTED_PROXIES) jadi list bersih.
func splitCSV(raw string) []string {
	var out []string
	for _, p := range strings.Split(raw, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

// cookieSecure menyalakan flag Secure kalau frontend berjalan di https.
// Bisa dioverride paksa via COOKIE_SECURE=true/false.
func cookieSecure(frontendURL string) bool {
	if override := strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SECURE"))); override != "" {
		return override == "true" || override == "1" || override == "yes"
	}
	return strings.HasPrefix(strings.ToLower(strings.TrimSpace(frontendURL)), "https://")
}

// cookieSameSite membaca COOKIE_SAMESITE (lax/strict/none, default lax).
// Lax = cookie ikut pada navigasi top-level + request same-site, tapi tidak
// pada fetch cross-site dari origin asing (perlindungan CSRF dasar).
// SameSite=None selalu dipaksa Secure (syarat browser).
func cookieSameSite(raw string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}
