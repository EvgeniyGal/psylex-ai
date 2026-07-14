-- Filtered postgres_changes (eq filters) need FULL replica identity
-- so UPDATE/DELETE payloads include the row's primary key for matching.

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'rooms',
    'room_messages',
    'users',
    'user_test_completions'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', tbl);
    END IF;
  END LOOP;
END $$;
