package repository

import (
	"context"
	"time"

	"backend/internal/apperrors"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TokenBlacklistRepository struct {
	db *pgxpool.Pool
}

func NewTokenBlacklistRepository(db *pgxpool.Pool) *TokenBlacklistRepository {
	return &TokenBlacklistRepository{db: db}
}

func (r *TokenBlacklistRepository) Create(
	ctx context.Context,
	tokenHash string,
	expiresAt time.Time,
) error {
	query := `
		INSERT INTO token_blacklists (token_hash, expires_at)
		VALUES ($1, $2)
		ON CONFLICT (token_hash) DO NOTHING
	`

	_, err := r.db.Exec(ctx, query, tokenHash, expiresAt)
	if err != nil {
		return apperrors.ErrDatabase
	}

	return nil
}

func (r *TokenBlacklistRepository) IsBlacklisted(
	ctx context.Context,
	tokenHash string,
) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM token_blacklists
			WHERE token_hash = $1 AND expires_at > NOW()
		)
	`

	var exists bool
	if err := r.db.QueryRow(ctx, query, tokenHash).Scan(&exists); err != nil {
		return false, apperrors.ErrDatabase
	}

	return exists, nil
}
