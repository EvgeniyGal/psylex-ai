# PsyLex MVP First Look

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + lightweight shadcn setup
- NextAuth credentials auth (plain-text password for MVP)
- Drizzle ORM + PostgreSQL (self-hosted Supabase or Neon)
- Supabase Realtime for mediation / lobby live updates

## Setup

1. Copy `.env.example` to `.env`
2. Fill in `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
3. For live mediation UX, also set:
   - `NEXT_PUBLIC_SUPABASE_URL` — your self-hosted Supabase API URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key from Supabase
4. Install dependencies:

```bash
npm install
```

5. Generate migration files:

```bash
npm run db:generate
```

6. Apply migrations:

```bash
npm run db:migrate
```

Migration `0020_supabase_realtime` adds `rooms`, `room_messages`, `users`, and `user_test_completions` to the `supabase_realtime` publication so clients can subscribe to postgres changes.

7. Create admin user manually in DB (example):

```sql
INSERT INTO users (id, login, password, role, title, description, session_id)
VALUES (
  gen_random_uuid(),
  'psylex_550e8400-e29b-41d4-a716-446655440000',
  'change-me',
  'admin',
  'Admin',
  'System administrator',
  NULL
);
```

8. Run app:

```bash
npm run dev
```

## Supabase Realtime

Live updates prefer push, not polling:

1. **Postgres LISTEN/NOTIFY + SSE** (`/api/realtime/room/[roomId]`) — primary path; works with your self-hosted database after migration `0021`
2. **Supabase Realtime WebSocket** (`postgres_changes`) — also attempted when `NEXT_PUBLIC_SUPABASE_*` is set

On each change the client refetches authoritative state via Next.js server actions (no full state over the wire).

Tables/triggers watched:

| Table | Used for |
|-------|----------|
| `rooms` | phases, votes, handshake, pipeline flags |
| `room_messages` | new mediation messages |
| `users` | opposite-party readiness in lobby |
| `user_test_completions` | testing dashboard / lobby readiness |

### Self-hosted Realtime WebSocket (optional)

This project’s Kong Realtime endpoint currently returns **403** on WebSocket upgrade (`/realtime/v1/websocket`). Until that is fixed on the Supabase host (JWT secret / `x-api-key` mirroring / Realtime tenant), the app uses **SSE + `pg_notify`** so the lobby and room stay live without polling.

Checklist to get Supabase WS working later:

1. Realtime container healthy and reachable through Kong
2. `ANON_KEY` JWT signed with the same `JWT_SECRET` Realtime uses
3. Kong copies `apikey` → `x-api-key` on the Realtime WS route
4. Migration `0020` publication includes the tables above

Until then, SSE is enough — you should see a single `EventSource` to `/api/realtime/room/...` and **no** repeated `getMediationLobbyStatus` POSTs while idle.

## Routes

- `/` landing page (EN/UK with localStorage persistence)
- `/login` admin login
- `/admin/settings` settings placeholder
- `/admin/sessions` sessions + plaintiff/defendant management
- `/admin/mediators` mediator management
