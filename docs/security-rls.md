# Row Level Security (RLS)

PsyLex uses **NextAuth** for sessions and **Drizzle + `DATABASE_URL`** for all database reads and writes. Supabase is used only as hosted PostgreSQL and optional Realtime WebSocket transport.

Because `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public in the browser, Supabase PostgREST and Realtime must not expose table data to the `anon` role.

## What migration `0025_row_level_security` does

1. **Enables RLS** on every table in the `public` schema.
2. **Revokes** `SELECT` / `INSERT` / `UPDATE` / `DELETE` on public objects from `anon` and `authenticated`.
3. **Adds restrictive deny policies** on application tables so intent is visible in the Supabase dashboard.

The Next.js server connects with the **`postgres` pooler role** (`DATABASE_URL`), which bypasses RLS. Application behavior is unchanged.

Live updates remain on **Postgres NOTIFY + SSE** (`/api/realtime/room/[roomId]`, `/api/realtime/user/[userId]`), which enforce NextAuth authorization before streaming.

Supabase Realtime WebSocket (`postgres_changes`) may stop delivering row payloads under RLS; that path is additive only (see README).

## Apply

```bash
npm run db:migrate
```

Or run `drizzle/migrations/0025_row_level_security.sql` in the Supabase SQL editor.

## Verify

Replace placeholders and run locally:

```bash
# Should return [] or HTTP 200 with empty array — not user rows
curl "https://PROJECT_REF.supabase.co/rest/v1/users?select=id" \
  -H "apikey: ANON_KEY" \
  -H "Authorization: Bearer ANON_KEY"
```

In Supabase Dashboard → Database → Policies, each app table should show `deny_anon_api_access` and RLS enabled.

## Tables

| Table | Server access | Anon / PostgREST |
|-------|---------------|------------------|
| `users` | Drizzle | Denied |
| `rooms` | Drizzle | Denied |
| `room_messages` | Drizzle | Denied |
| `user_test_completions` | Drizzle | Denied |
| `magic_tokens` | Drizzle | Denied |
| `platform_settings` | Drizzle | Denied |
| `legal_documents` | Drizzle | Denied |
| `document_chunks` | Drizzle | Denied |
| `agent_prompts` | Drizzle | Denied |
| `pipeline_event_logs` | Drizzle | Denied |
| `mediation_filing_receipts` | Drizzle | Denied |

## Future: Supabase Auth + Realtime policies

If you later issue Supabase JWTs for logged-in users (custom access token hook mapping `auth.uid()` → `public.users.id`), you can replace deny-all with scoped **SELECT** policies on realtime tables only, for example:

```sql
-- Example only — requires Supabase Auth wired to public.users.id
DROP POLICY deny_anon_api_access ON public.rooms;

CREATE POLICY rooms_participant_select ON public.rooms
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT room_id FROM public.users WHERE id = auth.uid())
    OR created_by_user_id = auth.uid()
  );
```

Keep **deny-all** on sensitive tables (`platform_settings`, `magic_tokens`, `legal_documents`, `document_chunks`, `agent_prompts`, `pipeline_event_logs`).

Never expose `service_role` to the browser.

## New tables (Drizzle migrations)

After creating a table in a new Drizzle migration, lock it down in the same migration file:

```sql
SELECT public.psylex_lockdown_table('public.my_new_table');
```

The helper is created by `0025_row_level_security.sql`.
