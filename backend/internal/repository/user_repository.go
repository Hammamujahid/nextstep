package repository

import (
	"context"
	"database/sql"
	"errors"

	"backend/internal/apperrors"
	"backend/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

func scanUser(row pgx.Row) (*model.User, error) {
	user := &model.User{}
	var passwordHash sql.NullString

	err := row.Scan(
		&user.ID,
		&user.Username,
		&user.PhotoProfile,
		&user.Email,
		&passwordHash,
		&user.GoogleID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if passwordHash.Valid {
		user.PasswordHash = &passwordHash.String
	}

	return user, nil
}

func (r *UserRepository) Create(
	ctx context.Context,
	user *model.User,
) error {
	query := `
		INSERT INTO users (
			username,
			email,
			password_hash,
			photo_profile,
			google_id
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRow(
		ctx,
		query,
		user.Username,
		user.Email,
		user.PasswordHash,
		user.PhotoProfile,
		user.GoogleID,
	).Scan(
		&user.ID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "users_email_key":
				return apperrors.ErrEmailAlreadyExists
			case "users_username_key":
				return apperrors.ErrUsernameAlreadyExists
			}
		}
		return apperrors.ErrDatabase
	}

	return nil
}

func (r *UserRepository) FindByEmail(
	ctx context.Context,
	email string,
) (*model.User, error) {
	query := `
		SELECT
			id,
			username,
			photo_profile,
			email,
			password_hash,
			google_id,
			created_at,
			updated_at
		FROM users
		WHERE email = $1
	`

	user, err := scanUser(r.db.QueryRow(ctx, query, email))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.ErrUserNotFound
		}
		return nil, apperrors.ErrDatabase
	}

	return user, nil
}

func (r *UserRepository) FindByID(
	ctx context.Context,
	id int,
) (*model.User, error) {
	query := `
		SELECT
			id,
			username,
			photo_profile,
			email,
			password_hash,
			google_id,
			created_at,
			updated_at
		FROM users
		WHERE id = $1
	`

	user, err := scanUser(r.db.QueryRow(ctx, query, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.ErrUserNotFound
		}
		return nil, apperrors.ErrDatabase
	}

	return user, nil
}

func (r *UserRepository) FindByGoogleID(
	ctx context.Context,
	googleID string,
) (*model.User, error) {
	query := `
		SELECT
			id,
			username,
			photo_profile,
			email,
			password_hash,
			google_id,
			created_at,
			updated_at
		FROM users
		WHERE google_id = $1
	`

	user, err := scanUser(r.db.QueryRow(ctx, query, googleID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.ErrUserNotFound
		}
		return nil, apperrors.ErrDatabase
	}

	return user, nil
}

// LinkGoogleID menautkan akun Google ke user yang sudah ada
// (mis. user yang sebelumnya daftar pakai email+password).
func (r *UserRepository) LinkGoogleID(
	ctx context.Context,
	userID int,
	googleID string,
	photoURL *string,
) error {
	query := `
		UPDATE users
		SET google_id = $2,
			photo_profile = COALESCE(photo_profile, $3),
			updated_at = NOW()
		WHERE id = $1
	`

	_, err := r.db.Exec(ctx, query, userID, googleID, photoURL)
	if err != nil {
		return apperrors.ErrDatabase
	}

	return nil
}
