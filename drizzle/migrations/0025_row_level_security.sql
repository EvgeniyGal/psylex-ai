-- Row Level Security for PsyLex (NextAuth + Drizzle server access).
--
-- Architecture:
--   - All reads/writes go through Next.js via DATABASE_URL (postgres role bypasses RLS).
--   - NEXT_PUBLIC_SUPABASE_ANON_KEY is exposed to the browser for optional Realtime WS only.
--   - Without Supabase Auth there is no auth.uid() in the anon JWT, so API roles must
--     have zero table access. Authoritative live updates use app SSE (/api/realtime/*).
--
-- Effect:
--   - PostgREST (/rest/v1/*) returns no rows / denies writes for anon & authenticated.
--   - Supabase Realtime postgres_changes are filtered by RLS (anon receives no row payloads).
--   - Supabase security linter: RLS enabled on all public tables.
--
-- Future: If you adopt Supabase Auth, add permissive SELECT policies on realtime tables
-- keyed to auth.uid() mapped to public.users.id — see docs/security-rls.md.

-- Helper for new tables created in later Drizzle migrations:
--   SELECT public.psylex_lockdown_table('public.my_new_table');
CREATE OR REPLACE FUNCTION public.psylex_lockdown_table(target regclass)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target);
  EXECUTE format('REVOKE ALL ON TABLE %s FROM anon, authenticated', target);
  EXECUTE format('DROP POLICY IF EXISTS deny_anon_api_access ON %s', target);
  EXECUTE format(
    'CREATE POLICY deny_anon_api_access ON %s AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
    target
  );
END;
$$;

REVOKE ALL ON FUNCTION public.psylex_lockdown_table(regclass) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.psylex_lockdown_table(regclass) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.psylex_lockdown_table(regclass) TO postgres, service_role;

-- 1. Enable RLS on every public table (including __drizzle_migrations if present).
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    PERFORM public.psylex_lockdown_table(format('public.%I', tbl)::regclass);
  END LOOP;
END $$;

-- 2. Remove remaining Supabase API role access on schema objects.
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;
