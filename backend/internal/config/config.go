package config

import (
	"os"

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
}

func Load() Config {
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")
	_ = godotenv.Load()

	return Config{
		DBHost:             os.Getenv("DB_HOST"),
		DBPort:             os.Getenv("DB_PORT"),
		DBUser:             os.Getenv("DB_USER"),
		DBPassword:         os.Getenv("DB_PASSWORD"),
		DBName:             os.Getenv("DB_NAME"),
		DBSSLMode:          os.Getenv("DB_SSLMODE"),
		Port:               os.Getenv("PORT"),
		JWTSECRET:          os.Getenv("JWT_SECRET"),
		FrontendURL:        firstNonEmpty(os.Getenv("FRONTEND_URL"), "http://localhost:3000"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL: firstNonEmpty(
			os.Getenv("GOOGLE_REDIRECT_URL"),
			"http://localhost:8080/api/v1/auth/google/callback",
		),
	}
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
