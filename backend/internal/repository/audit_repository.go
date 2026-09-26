package repository

import (
	"context"
	"time"

	"backend/internal/apperrors"

	"github.com/jackc/pgx/v5/pgxpool"
)

// AuditEntry adalah satu baris jejak aksi penting (siapa, di mana, apa, berhasil/tidak).
// WorkspaceID/UserID nil untuk aksi di luar workspace (mis. register) atau user tak dikenal.
type AuditEntry struct {
	WorkspaceID  *int
	UserID       *int
	Action       string
	ResourceType *string
	ResourceID   *int
	Status       int
	IPAddress    string
}

type AuditRepository struct {
	db *pgxpool.Pool
}

func NewAuditRepository(db *pgxpool.Pool) *AuditRepository {
	return &AuditRepository{db: db}
}

// Create menyimpan satu baris audit. Dipanggil async dari middleware;
// gagal simpan tidak boleh menggagalkan request (hanya log ke konsol).
func (r *AuditRepository) Create(ctx context.Context, e AuditEntry) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	_, err := r.db.Exec(
		ctx,
		`INSERT INTO audit_logs (workspace_id, user_id, action, resource_type, resource_id, status, ip_address)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		e.WorkspaceID,
		e.UserID,
		e.Action,
		e.ResourceType,
		e.ResourceID,
		e.Status,
		nullIfEmpty(e.IPAddress),
	)
	if err != nil {
		return apperrors.ErrDatabase
	}
	return nil
}

func nullIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
