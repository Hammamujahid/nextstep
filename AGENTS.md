# AGENTS.md — nextstep

Monorepo: `backend/` (Go + Gin + pgx, module `backend`) and `frontend/` (Next.js 16 + React 19 + Tailwind 4). No CI, no tests (`go test ./...` reports no test files everywhere). README is empty; `frontend/AGENTS.md` is an auto-generated Next.js block — leave it alone. `frontend/CLAUDE.md` just points at it.

## Backend

- Layout is handler → service → repository, **one service file per table** (see comment at top of `internal/service/task_service.go`). Routes live in `internal/router/router.go`; all API routes are under `/api/v1`.
- Config comes from root `.env` (`internal/config` loads `../.env` first), so run everything with `backend/` as workdir. DB is local Postgres (`DB_*` in root `.env`).
- Migrations are golang-migrate style in `backend/migrations` (`000024_*` latest: `assignee_id` on tasks/projects/goals/job_applications). Apply from `backend/`:
  `migrate -path migrations -database "postgres://postgres:bismillah@localhost:5432/nextstep?sslmode=disable" up`
  `migrate` prints progress to stderr (looks like a PowerShell error, it isn't); confirm via `schema_migrations`.
- For ad-hoc SQL: `$env:PGPASSWORD="bismillah"` + `C:\Program Files\PostgreSQL\15\bin\psql.exe -h localhost -U postgres -d nextstep`.
- Build/run: `go build -o server.exe ./cmd/server` in `backend/`, then run `server.exe` with workdir `backend/` on port `:8080`. Only one instance at a time — **restart it after every rebuild**, otherwise new routes/handlers won't load. `backend/server.exe` is a local build artifact (gitignored), never commit it.
- Verify with `go vet ./...`. There are no tests — verify behavior with curl instead. Mint dev JWTs with a temp `*.go` using `service.NewJWTService(<JWT_SECRET from root .env>).GenerateToken(userID)` via `go run`, then delete it.
- Dev seed: `go run ./cmd/seed` in `backend/` creates 5 accounts (`*@nextstep.test`, password `password123`, each admin of 3 workspaces + cross-memberships with varied permissions). Idempotent — re-running skips when seed exists. Dev-only, never run against prod.
- Auth: session via HttpOnly cookies (`ns_access` 24h JWT + `ns_refresh` 30d opaque, sha256-hashed in `refresh_tokens`). `POST /auth/refresh` rotates (old refresh is revoked, reuse → 401). Bearer header and `?token=` query still accepted as fallback (curl/non-browser clients). Google OAuth callback sets cookies then redirects clean (no tokens in URL). Cookie flags: `Secure` follows `FRONTEND_URL` scheme (override `COOKIE_SECURE`), `SameSite` from `COOKIE_SAMESITE` (default `Lax`; use `None` for cross-site deploys like Vercel+Render). CSRF relies on `SameSite` + CORS preflight. Responses use `{"data": ...}` envelopes; errors use `{"message": ...}` with 400/401/403/404/409 as appropriate.
- Permissions: `workspace_member_permissions` per (member × `project|task|goal|job_application`) with `none|viewer|editor`; admin bypasses everything (`GetMemberPermission` returns `editor` for admin, `viewer` when no row). Enforce in services via `PermissionRepository`, and on routes via `middleware.RequireResourcePermission(repo, resource, write)` — read endpoints pass `write=false`, mutations `true`. `GET /metrics` zeroes `none` sections instead of 403ing.
- Assignee: `assignee_id FK users SET NULL` on tasks/projects/goals/job_applications. Must be a member whose permission on that resource isn't `none`, else 400 (`ErrInvalidAssignee`); unassign via `clear_assignee_id`; list responses embed `assignee{id,username,email}`; `GET /workspaces/:id/assignable?resource=` feeds the dropdowns.
- Member management (all admin-only): `DELETE /workspaces/:id/members/:memberId` removes the member + 4 permission rows + clears their `active_workspace_id` in one tx (`DeleteMemberTx`); guards are `ErrCannotRemoveSelf` (400), `ErrLastAdmin` (400). `PATCH /workspaces/:id/members/:memberId` with `{resource, permission}` (both `oneof`-validated) upserts one row (`UpsertMemberPermission`); guards are `ErrCannotEditSelf` (400), `ErrTargetIsAdmin` (400). Repo helpers: `FindMemberByID`, `CountAdmins`.
- SSE `GET /workspaces/:id/events` takes the token via `?token=` (EventSource can't send headers); events only trigger refetches, all data still goes through gated endpoints.
- CORS: single global `middleware.CORS` (allowlist = `FRONTEND_URL` + `http://localhost:3000`, origins normalized against trailing slashes, `Vary: Origin` always set, `Allow-Credentials: true` with explicit origin — never `*`). Never set per-handler `Access-Control-Allow-Origin`. Cookie sessions require credentials mode (`credentials: "include"` / EventSource `withCredentials`).
- Rate limiting: in-memory fixed-window per IP in `middleware.RateLimit` (no new deps; single-instance only, move to Redis if multi-replica). Wired in `router.go`: login/register 10/min, refresh 30/min, whole `/api/v1` 600/min. OPTIONS preflight not counted. Over-limit → 429 + `Retry-After`.
- Audit log: `audit_logs` table (migration `000025_*`) + `middleware.AuditLogger` on `/api/v1` records every POST/PUT/PATCH/DELETE async (never blocks the response; writes use `context.Background` since the request ctx is cancelled). Columns: `workspace_id`, `user_id` (NULL for pre-auth actions like login), `action` (e.g. `task.update`, `member.remove`, `auth.login`), `resource_type`, `resource_id`, `status`, `ip_address`. GET/HEAD/OPTIONS not logged.
- Security headers: global `middleware.SecurityHeaders` on every response (HSTS, `nosniff`, `DENY` + `frame-ancestors 'deny'`, CSP `default-src 'none'`, strict `Referrer-Policy`). Safe for the JSON/SSE-only API.

## Frontend

- Dev on `:3000` (`npm run dev` in `frontend/`); API base is `http://localhost:8080/api/v1` (`NEXT_PUBLIC_API_URL` override). Verify with `npx tsc --noEmit` then `npm run build`.
- All authed fetches must go through `lib/apiClient.ts` (`apiFetch`): sends `credentials: "include"` (HttpOnly cookie session, no `Authorization` header, no tokens in JS/localStorage), and on 401 does single-flight silent refresh + one retry, else redirects to `/login`. Do not add new raw `fetch` calls to protected endpoints. Session check = `sessionActive()` (`GET /me`), never a localStorage token.
- Permission-aware UI reads `myRole`/`perms` from `useDashboard()` plus `canRead`/`canEdit` in `lib/permissions.ts`. Established patterns: hide nav items with `none` (see `hiddenNavs` in `app/dashboard/layout.tsx`), return `<AccessDenied resource="..."/>` for `none` pages, and drill `canEdit` (default `true`) to disable/hide mutation controls for viewers. Backend remains the enforcer — UI gating is cosmetic.
- `GET /workspaces/:id/my-permissions` feeds the provider; `users.active_workspace_id` is the server-side last-opened workspace (set on select/create/accept), preferred over the `nextstep_workspace_id` localStorage fallback at init.
- Workspace invitations carry per-resource permissions; accept creates a `member` row + 4 permission rows in one transaction.
- Shared inline-edit UI in `components/ui/`: `InlineSelect` (custom pill button + portal menu, **always centered on the trigger button**, auto-flips up when near viewport bottom), `DueDateSelect` (date/time + Clear/Save in the same centered portal pattern), `AssigneeSelect`/`AssigneeBadge`, `RowActionMenu` (titik-tiga edit/delete). Filter/sort selects and in-modal selects stay native.
- Edit rules — **one modal per resource for text/relation fields, inline dropdowns for the rest**:
  - Goals: modal = title + description (`EditGoalModal`); dropdown = assignee on the card.
  - Tasks: modal = title + estimate + goal + project (`EditTaskModal`); dropdowns = due + status + priority + assignee in list table and board cards.
  - Applications: modal = title + company + url (`EditApplicationModal`); dropdowns = status + due + assignee in pipeline and table; job URL is shown as a truncated link below the company in both.
  - Projects: modal = name + description + assignee (`EditProjectModal`); dropdowns = status + assignee in grid and table.
- Members page: Action column has two-step Remove (admin only, never own row) and the 4 permission cells are `InlineSelect` dropdowns for admins (own row, fellow admins, and invite rows stay static badges). No Workspace-info card and no Invite-someone card; Permission Levels is full width.
- Page layouts (stats cards removed everywhere): tasks = Today (left) + Upcoming (right), then full-width All Tasks (no Workspace column, no "Personal Task" subtitle) + Keep Going; projects = full-width Project Progress, no Recent Activity; applications = Your Job Search (left) + Upcoming Activities (right); goals = Overview + Needs Attention, paginated list (5/page).
- Landing/login/register share the `Tila` example persona (mock greeting, AuthShell preview, input placeholders). Landing footer is copyright-only, centered; hero mockup mirrors the real dashboard (6-icon nav, greeting + goal card, task rows with priority/status pills + assignee avatars).
- Dead code, do not revive: `tasks/TaskBoard|TaskListView|TaskCard|TasksHeader`, `applications/ApplicationCard|ApplicationsBoard|ApplicationsTable|ApplicationsFilterBar|ApplicationsHeader|ApplicationsStats`, `projects/ProjectsGrid|ProjectsStats|ProjectsFilterBar|ProjectsHeader|ProjectsTable`, `goals/GoalsHeader` — the `*View.tsx` files render everything inline.

## AI / LLM Architecture

NextStep memiliki AI-powered assistant yang berjalan di backend.

### Prinsip utama

- LLM tidak boleh mengakses PostgreSQL maupun repository secara langsung.
- AI hanya boleh bertindak lewat tools yang memanggil service layer yang sudah ada.
- Business logic dan permission tetap menjadi tanggung jawab backend; backend tetap authority untuk authorization.
- Identitas user berasal dari JWT/authenticated request, bukan dari input model.
- `workspace_id` yang dipakai AI harus berasal dari authenticated request/context.
- Jangan pernah mempercayai `user_id`, `workspace_id`, role, atau permission yang diberikan oleh model.
- AI agent tidak boleh melewati permission system yang sudah ada.

### Alur arsitektur

```text
Next.js → Gin AI Handler → AI Orchestrator/Agent → AI Tools → Existing Services → Repositories → PostgreSQL
```

Contoh — AI membuat task:

```text
User ("Tambahkan task belajar Docker") → LLM → create_task tool → TaskService
  → cek workspace + permission → TaskRepository → PostgreSQL
```

Jangan pernah membuat jalur `AI → PostgreSQL` (mis. `AI → database.Query(...)`).

### AI context

Setiap AI request wajib membawa context dari authenticated request (ditentukan backend, bukan model):

- `user_id`, `workspace_id`, role, permissions.

### Struktur paket

```text
backend/internal/ai/
├── client.go
├── prompt.go
├── context.go
├── agent.go
└── tools/
    ├── task_tools.go
    ├── goal_tools.go
    ├── project_tools.go
    ├── application_tools.go
    └── workspace_tools.go
```

### AI client

LLM client berada di `backend/internal/ai/client.go`. API key dan konfigurasi model hanya dari environment variables (mis. `OPENAI_API_KEY`, `OPENAI_MODEL`); API key tidak boleh dikirim ke frontend.

### AI endpoints

Prefix `/api/v1/ai` (tetap di `internal/router/router.go`, tetap di bawah auth middleware):

```text
POST   /api/v1/ai/chat
GET    /api/v1/ai/conversations
GET    /api/v1/ai/conversations/:id
DELETE /api/v1/ai/conversations/:id
```

Request dari frontend wajib memakai `apiFetch`.

### AI tools

- Read tools (hanya membaca data yang boleh diakses user): `get_my_tasks`, `get_my_goals`, `get_my_projects`, `get_my_job_applications`, `get_workspace_summary`.
- Write tools (mengubah data, wajib melewati business logic + permission validation yang sama dengan API biasa): `create_task`, `update_task`, `create_goal`, `update_goal`, `create_project`, `update_project`.

### Agent rules

Agent boleh: memahami permintaan user, mengambil data via read tools, menggabungkan info dari beberapa tools, memberi rekomendasi, dan mutasi via write tools jika diizinkan.

Agent tidak boleh: SQL langsung, melewati service layer / permission system, menentukan identitas sendiri, mengubah data tanpa authorization, atau destructive/bulk operation tanpa confirmation.

### Confirmation

Operasi berdampak signifikan wajib meminta confirmation dulu. Contoh: user minta "Hapus semua task yang sudah selesai" → agent menjawab "Saya menemukan 12 task berstatus selesai. Apakah Anda yakin ingin menghapus semuanya?" dan baru memanggil destructive tool setelah user mengiyakan.

### Conversation persistence

Disimpan di database:

- `ai_conversations` berelasi ke `user_id` + `workspace_id`.
- `ai_messages` berelasi ke `conversation_id` (+ `role`, `content`, `created_at`).

### Urutan development

Kerjakan bertahap, jangan langsung multi-agent — mulai dari satu agent + kumpulan tools:

Phase 0 AI foundation → 1 Simple LLM chatbot → 2 Conversation persistence → 3 NextStep context → 4 Read-only AI tools → 5 AI Agent → 6 Write tools → 7 Permission & confirmation → 8 Streaming → 9 Career Agent → 10 Evaluation & production hardening.

## Production (Vercel frontend + Render/Railway backend, tanpa Docker)

- Backend: `APP_ENV=production` → gin release mode + fail-fast bila `JWT_SECRET` < 32 char + warning bila `DB_SSLMODE=disable`. Migrasi via `migrate` CLI ke hosted DB (`DB_SSLMODE=require`).
- Cookie lintas-situs wajib `COOKIE_SAMESITE=None` (+ `COOKIE_SECURE=true`, otomatis bila `FRONTEND_URL` https), karena frontend `*.vercel.app` dan backend `*.onrender.com` beda situs — `Lax` tidak terkirim pada fetch cross-site. `FRONTEND_URL` = URL Vercel produksi (masuk allowlist CORS); `GOOGLE_REDIRECT_URL` = URL callback backend produksi (daftarkan juga di Google Console).
- Frontend (Vercel): set `NEXT_PUBLIC_API_URL=https://<backend>/api/v1` **sebelum** build (`npm run build`).
- Di belakang reverse proxy, isi `TRUSTED_PROXIES` (CIDR/IP proxy) agar rate limiter melihat IP asli, bukan IP proxy.
- Branch `dev` dipertahankan untuk kerja lanjutan; `main` = siap publish.

## Working agreements

- Code comments and user-facing verification notes in this repo are written in Indonesian; keep it that way for new comments.
- Never leave test residue: delete probe users/tasks/workspaces/invitations and helper files (e.g. token minters) after curl verification. Confirm permission restores with a final SELECT when you temporarily change a member's permissions.
- PowerShell 5.1 here: no `try` as an expression, no `wc`; chain with `; if ($?) { ... }`, quote paths with spaces, and pass `workdir` instead of `cd`.
- Push via SSH (`git@github.com:Hammamujahid/nextstep.git`, key sudah terautentikasi); commit locally first, then push.
