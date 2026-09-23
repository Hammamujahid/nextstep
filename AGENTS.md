# AGENTS.md — nextstep

Monorepo: `backend/` (Go + Gin + pgx, module `backend`) and `frontend/` (Next.js 16 + React 19 + Tailwind 4). No CI, no tests (`go test ./...` reports no test files everywhere). README is empty; `frontend/AGENTS.md` is an auto-generated Next.js block — leave it alone. `frontend/CLAUDE.md` just points at it.

## Backend

- Layout is handler → service → repository, **one service file per table** (see comment at top of `internal/service/task_service.go`). Routes live in `internal/router/router.go`; all API routes are under `/api/v1`.
- Config comes from root `.env` (`internal/config` loads `../.env` first), so run everything with `backend/` as workdir. DB is local Postgres (`DB_*` in root `.env`).
- Migrations are golang-migrate style in `backend/migrations` (`000023_*` latest). Apply from `backend/`:
  `migrate -path migrations -database "postgres://postgres:bismillah@localhost:5432/nextstep?sslmode=disable" up`
  `migrate` prints progress to stderr (looks like a PowerShell error, it isn't); confirm via `schema_migrations`.
- For ad-hoc SQL: `$env:PGPASSWORD="bismillah"` + `C:\Program Files\PostgreSQL\15\bin\psql.exe -h localhost -U postgres -d nextstep`.
- Build/run: `go build -o server.exe ./cmd/server` in `backend/`, then run `server.exe` with workdir `backend/` on port `:8080`. Note `backend/server.exe` is git-tracked, so a rebuild dirties the tree.
- Verify with `go vet ./...`. There are no tests — verify behavior with curl instead. Mint dev JWTs with a temp `main.go` using `service.NewJWTService(<JWT_SECRET from root .env>).GenerateToken(userID)` via `go run`, then delete it.
- Auth: Bearer JWT (24h) + opaque refresh token (30d, sha256-hashed in `refresh_tokens`). `POST /auth/refresh` rotates (old refresh is revoked, reuse → 401). Responses use `{"data": ...}` envelopes; errors use `{"message": ...}` with 401/403/404/409 as appropriate.
- Permissions: `workspace_member_permissions` per (member × `project|task|goal|job_application`) with `none|viewer|editor`; admin bypasses everything (`GetMemberPermission` returns `editor` for admin, `viewer` when no row). Enforce in services via `PermissionRepository`, and on routes via `middleware.RequireResourcePermission(repo, resource, write)` — read endpoints pass `write=false`, mutations `true`. `GET /metrics` zeroes `none` sections instead of 403ing.
- SSE `GET /workspaces/:id/events` takes the token via `?token=` (EventSource can't send headers); events only trigger refetches, all data still goes through gated endpoints.

## Frontend

- Dev on `:3000` (`npm run dev` in `frontend/`); API base is `http://localhost:8080/api/v1` (`NEXT_PUBLIC_API_URL` override). Verify with `npx tsc --noEmit` then `npm run build`.
- All authed fetches must go through `lib/apiClient.ts` (`apiFetch`): attaches Bearer, and on 401 does single-flight silent refresh + one retry, else clears both tokens. Do not add new raw `fetch` calls with manual `Authorization` headers. Tokens live in localStorage as `nextstep_token` / `nextstep_refresh_token`.
- Permission-aware UI reads `myRole`/`perms` from `useDashboard()` plus `canRead`/`canEdit` in `lib/permissions.ts`. Established patterns: hide nav items with `none` (see `hiddenNavs` in `app/dashboard/layout.tsx`), return `<AccessDenied resource="..."/>` for `none` pages, and drill `canEdit` (default `true`) to disable/hide mutation controls for viewers. Backend remains the enforcer — UI gating is cosmetic.
- `GET /workspaces/:id/my-permissions` feeds the provider; `users.active_workspace_id` is the server-side last-opened workspace (set on select/create/accept), preferred over the `nextstep_workspace_id` localStorage fallback at init.
- Workspace invitations carry per-resource permissions; accept creates a `member` row + 4 permission rows in one transaction.

## Working agreements

- Code comments and user-facing verification notes in this repo are written in Indonesian; keep it that way for new comments.
- Never leave test residue: delete probe users/tasks/workspaces/invitations and helper files (e.g. token minters) after curl verification. Confirm permission restores with a final SELECT when you temporarily change a member's permissions.
- PowerShell 5.1 here: no `try` as an expression, no `wc`; chain with `; if ($?) { ... }`, quote paths with spaces, and pass `workdir` instead of `cd`.
