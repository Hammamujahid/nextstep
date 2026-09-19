package repository

import (
	"context"
	"errors"
	"time"

	"backend/internal/apperrors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RefreshToken struct {
	ID        int
	UserID    int
	ExpiresAt time.Time
	RevokedAt *time.Time
}

type RefreshTokenRepository struct {
	db *pgxpool.Pool
}

func NewRefreshTokenRepository(db *pgxpool.Pool) *RefreshTokenRepository {
	return &RefreshTokenRepository{db: db}
}

func (r *RefreshTokenRepository) Create(
	ctx context.Context,
	userID int,
	tokenHash string,
	expiresAt time.Time,
) error {
	_, err := r.db.Exec(
		ctx,
		`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
		userID,
		tokenHash,
		expiresAt,
	)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
}

func (r *RefreshTokenRepository) FindByHash(
	ctx context.Context,
	tokenHash string,
) (*RefreshToken, error) {
	var t RefreshToken
	var revokedAt *time.Time
	err := r.db.QueryRow(
		ctx,
		`SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`,
		tokenHash,
	).Scan(&t.ID, &t.UserID, &t.ExpiresAt, &revokedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.ErrInvalidToken
		}
		return nil, apperrors.ErrDatabase
	}
	t.RevokedAt = revokedAt
	return &t, nil
}

func (r *RefreshTokenRepository) RevokeByHash(
	ctx context.Context,
	tokenHash string,
) error {
	_, err := r.db.Exec(
		ctx,
		`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL`,
		tokenHash,
	)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
}

func (r *RefreshTokenRepository) RevokeAllForUser(
	ctx context.Context,
	userID int,
) error {
	_, err := r.db.Exec(
		ctx,
		`UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
		userID,
	)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
}
