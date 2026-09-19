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
	var activeWorkspaceID sql.NullInt64

	err := row.Scan(
		&user.ID,
		&user.Username,
		&user.PhotoProfile,
		&user.Email,
		&passwordHash,
		&user.GoogleID,
		&activeWorkspaceID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if passwordHash.Valid {
		user.PasswordHash = &passwordHash.String
	}
	if activeWorkspaceID.Valid {
		v := int(activeWorkspaceID.Int64)
		user.ActiveWorkspaceId = &v
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
			active_workspace_id,
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
			active_workspace_id,
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
			active_workspace_id,
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

// UpdateProfile mengubah username dan/atau email. Field nil = tidak diubah.
func (r *UserRepository) UpdateProfile(
	ctx context.Context,
	userID int,
	username *string,
	email *string,
) (*model.User, error) {
	var updated model.User
	var passwordHash sql.NullString
	var googleID *string
	var activeWorkspaceID sql.NullInt64
	err := r.db.QueryRow(
		ctx,
		`UPDATE users
		 SET username = COALESCE($2, username),
		     email = COALESCE($3, email),
		     updated_at = NOW()
		 WHERE id = $1
		 RETURNING id, username, photo_profile, email, password_hash, google_id, active_workspace_id, created_at, updated_at`,
		userID,
		username,
		email,
	).Scan(
		&updated.ID,
		&updated.Username,
		&updated.PhotoProfile,
		&updated.Email,
		&passwordHash,
		&googleID,
		&activeWorkspaceID,
		&updated.CreatedAt,
		&updated.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			switch pgErr.ConstraintName {
			case "users_email_key":
				return nil, apperrors.ErrEmailAlreadyExists
			case "users_username_key":
				return nil, apperrors.ErrUsernameAlreadyExists
			}
		}
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, apperrors.ErrUserNotFound
		}
		return nil, apperrors.ErrDatabase
	}
	updated.GoogleID = googleID
	if activeWorkspaceID.Valid {
		v := int(activeWorkspaceID.Int64)
		updated.ActiveWorkspaceId = &v
	}
	return &updated, nil
}

// SetActiveWorkspace menyimpan workspace yang sedang dibuka user.
func (r *UserRepository) SetActiveWorkspace(
	ctx context.Context,
	userID int,
	workspaceID int,
) error {
	_, err := r.db.Exec(
		ctx,
		`UPDATE users SET active_workspace_id = $2, updated_at = NOW() WHERE id = $1`,
		userID,
		workspaceID,
	)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
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
