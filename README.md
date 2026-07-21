# PsyLex MVP First Look

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + lightweight shadcn setup
- NextAuth credentials auth (plain-text password for MVP)
- Drizzle ORM + PostgreSQL (Supabase Cloud recommended)
- Supabase Realtime for mediation / lobby live updates

## Setup

1. Copy `.env.example` to `.env`
2. Fill in:
   - `DATABASE_URL` — **Session pooler** URI from Supabase Dashboard → Connect  
     (direct `db.*.supabase.co` is IPv6-only; most home networks need the pooler)
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   - `NEXT_PUBLIC_SUPABASE_URL` — `https://<project>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public JWT from Project Settings → API
3. Install dependencies:

```bash
npm install
```

4. Generate migration files:

```bash
npm run db:generate
```

5. Apply migrations:

```bash
npm run db:migrate
```

Migration `0020_supabase_realtime` adds `rooms`, `room_messages`, `users`, and `user_test_completions` to the `supabase_realtime` publication.  
Migration `0022_realtime_replica_identity` sets `REPLICA IDENTITY FULL` so filtered UPDATE/DELETE events work.

6. Create admin user manually in DB (example):

```sql
INSERT INTO users (id, login, password, role, title, description, room_id)
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

7. Run app:

```bash
npm run dev
```

### Migrating from self-hosted Supabase

Keep the old DB URL as `O_DATABASE_URL`, set cloud pooler as `DATABASE_URL`, then:

```bash
node scripts/migrate-selfhosted-to-cloud.mjs
```

## Supabase Realtime

Live updates use push, not polling:

1. **Postgres LISTEN/NOTIFY + SSE** (`/api/realtime/room/[roomId]`) — always on (works with NextAuth)
2. **Supabase Realtime WebSocket** (`postgres_changes`) — additive when `NEXT_PUBLIC_SUPABASE_URL` is configured

SSE stays active even if the WebSocket reports subscribed but RLS blocks event delivery. Changes are debounced before refetching authoritative state via server actions.

Tables watched:

| Table | Used for |
|-------|----------|
| `rooms` | phases, votes, handshake, pipeline flags |
| `room_messages` | new mediation messages |
| `users` | opposite-party readiness in lobby |
| `user_test_completions` | testing dashboard / lobby readiness |

## Routes

- `/` landing page (EN/UK with localStorage persistence)
- `/login` admin login
- `/admin/settings` settings placeholder
- `/admin/sessions` sessions + plaintiff/defendant management
- `/admin/mediators` mediator management
