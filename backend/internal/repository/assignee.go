package repository

import (
	"context"

	"backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

// FetchAssignee mengambil info ringkas user untuk assignee_id.
// Mengembalikan (nil, nil) bila assigneeID nil atau user tidak ditemukan
// (mis. user dihapus — kolom memakai ON DELETE SET NULL).
func FetchAssignee(
	ctx context.Context,
	db *pgxpool.Pool,
	assigneeID *int,
) (*model.Assignee, error) {
	if assigneeID == nil {
		return nil, nil
	}
	var a model.Assignee
	err := db.QueryRow(ctx,
		`SELECT id, username, email FROM users WHERE id = $1`, *assigneeID,
	).Scan(&a.ID, &a.Username, &a.Email)
	if err != nil {
		return nil, nil
	}
	return &a, nil
}

// ScanAssignee membaca kolom assignee hasil LEFT JOIN users (a.id, a.username, a.email)
// ke dalam sepasang field AssigneeId/Assignee pada struct resource.
// pgx memindai NULL menjadi nil untuk *int/*string, jadi tidak perlu sql.Null*.
func ScanAssignee(
	id *int,
	username *string,
	email *string,
) (*int, *model.Assignee) {
	if id == nil {
		return nil, nil
	}
	name, mail := "", ""
	if username != nil {
		name = *username
	}
	if email != nil {
		mail = *email
	}
	return id, &model.Assignee{
		ID:       *id,
		Username: name,
		Email:    mail,
	}
}
