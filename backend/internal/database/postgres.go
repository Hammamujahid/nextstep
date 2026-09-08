package database

import (
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"

	"backend/internal/config"
)

func NewPostgresPool(cfg config.Config) *pgxpool.Pool {
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		cfg.DBSSLMode,
	)

	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatal("Failed to create PostgreSQL pool:", err)
	}

	err = pool.Ping(context.Background())
	if err != nil {
		log.Fatal("Failed to connect to PostgreSQL:", err)
	}

	log.Println("Successfully connected to PostgreSQL")

	return pool
}