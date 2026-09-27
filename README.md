# NextStep

Career workspace: goals, projects, tasks, dan job applications dalam satu tempat — dengan workspace, role member, dan permission per resource (`none`/`viewer`/`editor`).

## Struktur

- `backend/` — Go + Gin + pgx + PostgreSQL (`go 1.27`)
- `frontend/` — Next.js 16 + React 19 + Tailwind 4

## Jalan lokal

Backend (workdir `backend/`, butuh Postgres lokal + file `.env` di root — contoh di `.env.example`):

```bash
migrate -path migrations -database "postgres://postgres:<pass>@localhost:5432/nextstep?sslmode=disable" up
go build -o server.exe ./cmd/server
./server.exe   # :8080
```

Frontend (workdir `frontend/`):

```bash
npm install
npm run dev    # :3000
```

Auth memakai cookie HttpOnly (`ns_access`/`ns_refresh`), jadi buka frontend di browser (bukan curl tanpa cookie).

## Deploy production (Vercel + Render, tanpa Docker)

Backend (Render, native Go build):

- `APP_ENV=production`, `JWT_SECRET` acak ≥ 32 char, `DB_SSLMODE=require`
- `FRONTEND_URL=https://<app>.vercel.app`, `COOKIE_SAMESITE=None` (wajib untuk cookie lintas-situs), `GOOGLE_REDIRECT_URL=https://<backend>/api/v1/auth/google/callback` (daftarkan juga di Google Console)
- `TRUSTED_PROXIES` bila di belakang proxy; jalankan migrasi ke hosted DB

Frontend (Vercel): set `NEXT_PUBLIC_API_URL=https://<backend>/api/v1` sebelum build.

Detail arsitektur dan aturan kerja ada di `AGENTS.md`.
