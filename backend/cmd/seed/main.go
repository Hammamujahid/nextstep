package main

// Seeder ala Laravel untuk development: 5 akun, masing-masing pemilik
// 3 workspace (15 workspace), plus relasi silang antar akun di dalamnya
// (role + kombinasi permission bervariasi, termasuk satu `none` untuk
// latihan gating). Idempotent: jika seed sudah ada, lewati.
//
// Jalankan dari folder backend: go run ./cmd/seed
// Login pakai password "password123" untuk semua akun seed.

import (
	"context"
	"errors"
	"fmt"
	"log"

	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/model"
	"backend/internal/repository"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

const seedPassword = "password123"

type seedUser struct {
	Username string
	Email    string
}

var users = []seedUser{
	{Username: "tila", Email: "tila@nextstep.test"},
	{Username: "budi", Email: "budi@nextstep.test"},
	{Username: "sari", Email: "sari@nextstep.test"},
	{Username: "agus", Email: "agus@nextstep.test"},
	{Username: "dewi", Email: "dewi@nextstep.test"},
}

type permSet map[string]string

var (
	fullEditor = permSet{"project": "editor", "task": "editor", "goal": "editor", "job_application": "editor"}
	allViewer  = permSet{"project": "viewer", "task": "viewer", "goal": "viewer", "job_application": "viewer"}
)

type seedMember struct {
	Email string
	Role  string  // admin | member
	Perms permSet // diabaikan bila Role == "admin" (admin selalu full akses)
}

type seedWorkspace struct {
	Name        string
	Description string
	OwnerEmail  string
	Members     []seedMember
}

var workspaces = []seedWorkspace{
	{
		Name: "Karier Tila", Description: "Roadmap karier utama Tila", OwnerEmail: "tila@nextstep.test",
		Members: []seedMember{
			{Email: "budi@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "editor", "goal": "editor", "job_application": "viewer"}},
			{Email: "sari@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
	{
		Name: "Freelance Tila", Description: "Proyek freelance Tila", OwnerEmail: "tila@nextstep.test",
		Members: []seedMember{
			{Email: "agus@nextstep.test", Role: "member", Perms: permSet{"project": "editor", "task": "editor", "goal": "viewer", "job_application": "none"}},
		},
	},
	{
		Name: "Job Hunt 2026", Description: "Berburu kerja 2026", OwnerEmail: "tila@nextstep.test",
		Members: []seedMember{
			{Email: "dewi@nextstep.test", Role: "member", Perms: allViewer},
			{Email: "budi@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "viewer", "goal": "viewer", "job_application": "editor"}},
		},
	},
	{
		Name: "Karier Budi", Description: "Roadmap karier Budi", OwnerEmail: "budi@nextstep.test",
		Members: []seedMember{
			{Email: "tila@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "editor", "goal": "viewer", "job_application": "viewer"}},
			{Email: "agus@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
	{
		Name: "Startup Budi", Description: "Ide startup Budi", OwnerEmail: "budi@nextstep.test",
		Members: []seedMember{
			{Email: "sari@nextstep.test", Role: "member", Perms: permSet{"project": "editor", "task": "viewer", "goal": "viewer", "job_application": "viewer"}},
			{Email: "dewi@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "none", "goal": "viewer", "job_application": "viewer"}},
		},
	},
	{
		Name: "Belajar Budi", Description: "Belajar hal baru", OwnerEmail: "budi@nextstep.test",
		Members: []seedMember{
			{Email: "tila@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
	{
		Name: "Karier Sari", Description: "Roadmap karier Sari", OwnerEmail: "sari@nextstep.test",
		Members: []seedMember{
			{Email: "tila@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "viewer", "goal": "editor", "job_application": "viewer"}},
			{Email: "dewi@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "editor", "goal": "viewer", "job_application": "viewer"}},
		},
	},
	{
		Name: "Portofolio Sari", Description: "Koleksi karya Sari", OwnerEmail: "sari@nextstep.test",
		Members: []seedMember{
			{Email: "budi@nextstep.test", Role: "member", Perms: allViewer},
			{Email: "agus@nextstep.test", Role: "member", Perms: permSet{"project": "editor", "task": "viewer", "goal": "viewer", "job_application": "viewer"}},
		},
	},
	{
		Name: "Job Hunt Sari", Description: "Berburu kerja Sari", OwnerEmail: "sari@nextstep.test",
		Members: []seedMember{
			{Email: "dewi@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
	{
		Name: "Karier Agus", Description: "Roadmap karier Agus", OwnerEmail: "agus@nextstep.test",
		Members: []seedMember{
			{Email: "tila@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "editor", "goal": "viewer", "job_application": "viewer"}},
			{Email: "budi@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
	{
		Name: "Riset Agus", Description: "Riset teknologi Agus", OwnerEmail: "agus@nextstep.test",
		Members: []seedMember{
			{Email: "sari@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "viewer", "goal": "editor", "job_application": "viewer"}},
			{Email: "dewi@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
	{
		Name: "Freelance Agus", Description: "Proyek freelance Agus", OwnerEmail: "agus@nextstep.test",
		Members: []seedMember{
			{Email: "tila@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
	{
		Name: "Karier Dewi", Description: "Roadmap karier Dewi", OwnerEmail: "dewi@nextstep.test",
		Members: []seedMember{
			{Email: "tila@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "editor", "goal": "editor", "job_application": "viewer"}},
			{Email: "sari@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
	{
		Name: "Bisnis Dewi", Description: "Usaha sampingan Dewi", OwnerEmail: "dewi@nextstep.test",
		Members: []seedMember{
			{Email: "budi@nextstep.test", Role: "member", Perms: permSet{"project": "editor", "task": "viewer", "goal": "viewer", "job_application": "viewer"}},
			{Email: "agus@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
	{
		Name: "Job Hunt Dewi", Description: "Berburu kerja Dewi", OwnerEmail: "dewi@nextstep.test",
		Members: []seedMember{
			{Email: "sari@nextstep.test", Role: "member", Perms: permSet{"project": "viewer", "task": "viewer", "goal": "viewer", "job_application": "editor"}},
			{Email: "tila@nextstep.test", Role: "member", Perms: allViewer},
		},
	},
}

func main() {
	cfg := config.Load()
	pool := database.NewPostgresPool(cfg)
	defer pool.Close()
	ctx := context.Background()

	// idempotency sederhana: kalau workspace seed pertama sudah ada, anggap selesai
	var exists int
	if err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM workspaces w
		 JOIN workspace_members m ON m.workspace_id = w.id
		 JOIN users u ON u.id = m.user_id
		 WHERE w.name = 'Karier Tila' AND u.email = 'tila@nextstep.test'`,
	).Scan(&exists); err != nil {
		log.Fatal("seed check error:", err)
	}
	if exists > 0 {
		fmt.Println("seed sudah ada, lewati (tidak ada yang diubah)")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(seedPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("hash error:", err)
	}

	userIDs := make(map[string]int, len(users))
	userNames := make(map[string]string, len(users))
	for _, u := range users {
		id, name, err := ensureUser(ctx, pool, u.Username, u.Email, string(hash))
		if err != nil {
			log.Fatal("seed user error:", err)
		}
		userIDs[u.Email] = id
		userNames[u.Email] = name
	}

	wsRepo := repository.NewWorkspaceRepository(pool)
	firstWS := make(map[string]int)
	firstWSName := make(map[string]string)
	for _, w := range workspaces {
		ownerID := userIDs[w.OwnerEmail]
		desc := w.Description
		ws := &model.Workspace{Name: w.Name, Description: &desc}
		// pakai alur yang sama seperti aplikasi (admin + active_workspace)
		if err := wsRepo.CreateWithAdminMember(ctx, ws, ownerID); err != nil {
			log.Fatal("seed workspace error:", err)
		}
		if _, ok := firstWS[w.OwnerEmail]; !ok {
			firstWS[w.OwnerEmail] = ws.ID
			firstWSName[w.OwnerEmail] = w.Name
		}
		for _, m := range w.Members {
			if err := insertMemberTx(ctx, pool, ws.ID, userIDs[m.Email], m.Role, m.Perms); err != nil {
				log.Fatal("seed member error:", err)
			}
		}
	}

	// active_workspace tiap akun = workspace pertamanya
	for email, wsID := range firstWS {
		if _, err := pool.Exec(ctx,
			`UPDATE users SET active_workspace_id = $2 WHERE id = $1`,
			userIDs[email], wsID,
		); err != nil {
			log.Fatal("seed active workspace error:", err)
		}
	}

	fmt.Println("seed selesai: 5 akun × 3 workspace (15 workspace + relasi silang)")
	fmt.Println("login pakai password: password123")
	for _, u := range users {
		fmt.Printf("  - %-22s %-8s (workspace aktif: %s)\n", u.Email, userNames[u.Email], firstWSName[u.Email])
	}
}

// ensureUser pakai ulang akun bila email sudah ada (password di-reset agar
// bisa login), atau buat baru; bila username bentrok tambah suffix angka.
func ensureUser(ctx context.Context, pool *pgxpool.Pool, username, email, hash string) (int, string, error) {
	var id int
	if err := pool.QueryRow(ctx, `SELECT id FROM users WHERE email = $1`, email).Scan(&id); err == nil {
		if _, err := pool.Exec(ctx, `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`, id, hash); err != nil {
			return 0, "", err
		}
		var name string
		if err := pool.QueryRow(ctx, `SELECT username FROM users WHERE id = $1`, id).Scan(&name); err != nil {
			return 0, "", err
		}
		return id, name, nil
	}
	name := username
	for i := 1; ; i++ {
		err := pool.QueryRow(ctx,
			`INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
			name, email, hash,
		).Scan(&id)
		if err == nil {
			return id, name, nil
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == "users_username_key" {
			name = fmt.Sprintf("%s%d", username, i)
			continue
		}
		return 0, "", err
	}
}

// insertMemberTx meniru AcceptInvitationTx: baris member + 4 baris permission.
func insertMemberTx(ctx context.Context, pool *pgxpool.Pool, workspaceID, userID int, role string, perms permSet) error {
	tx, err := pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var memberID int
	if err := tx.QueryRow(ctx,
		`INSERT INTO workspace_members (workspace_id, user_id, member_role)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (workspace_id, user_id) DO UPDATE SET member_role = EXCLUDED.member_role
		 RETURNING id`,
		workspaceID, userID, role,
	).Scan(&memberID); err != nil {
		return err
	}
	for resource, perm := range perms {
		if _, err := tx.Exec(ctx,
			`INSERT INTO workspace_member_permissions (workspace_member_id, resource_type, permission)
			 VALUES ($1, $2, $3)
			 ON CONFLICT (workspace_member_id, resource_type) DO UPDATE SET permission = EXCLUDED.permission`,
			memberID, resource, perm,
		); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
