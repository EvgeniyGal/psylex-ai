-- App-level realtime: pg_notify on mediation-relevant table changes.
-- Used by Next.js SSE when Supabase Realtime WebSocket is unavailable.

CREATE OR REPLACE FUNCTION public.notify_mediation_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  rid uuid;
  uid uuid;
  payload text;
BEGIN
  IF TG_TABLE_NAME = 'rooms' THEN
    rid := COALESCE(NEW.id, OLD.id);
    payload := json_build_object(
      'table', TG_TABLE_NAME,
      'op', TG_OP,
      'room_id', rid
    )::text;
    PERFORM pg_notify('mediation_room', payload);
  ELSIF TG_TABLE_NAME = 'room_messages' THEN
    rid := COALESCE(NEW.room_id, OLD.room_id);
    payload := json_build_object(
      'table', TG_TABLE_NAME,
      'op', TG_OP,
      'room_id', rid
    )::text;
    PERFORM pg_notify('mediation_room', payload);
  ELSIF TG_TABLE_NAME = 'users' THEN
    rid := COALESCE(NEW.room_id, OLD.room_id);
    uid := COALESCE(NEW.id, OLD.id);
    IF rid IS NOT NULL THEN
      payload := json_build_object(
        'table', TG_TABLE_NAME,
        'op', TG_OP,
        'room_id', rid,
        'user_id', uid
      )::text;
      PERFORM pg_notify('mediation_room', payload);
    END IF;
    payload := json_build_object(
      'table', TG_TABLE_NAME,
      'op', TG_OP,
      'user_id', uid,
      'room_id', rid
    )::text;
    PERFORM pg_notify('mediation_user', payload);
  ELSIF TG_TABLE_NAME = 'user_test_completions' THEN
    uid := COALESCE(NEW.user_id, OLD.user_id);
    SELECT u.room_id INTO rid FROM public.users u WHERE u.id = uid;
    payload := json_build_object(
      'table', TG_TABLE_NAME,
      'op', TG_OP,
      'user_id', uid,
      'room_id', rid
    )::text;
    PERFORM pg_notify('mediation_user', payload);
    IF rid IS NOT NULL THEN
      PERFORM pg_notify('mediation_room', payload);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS rooms_notify_mediation ON public.rooms;
CREATE TRIGGER rooms_notify_mediation
AFTER INSERT OR UPDATE OR DELETE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.notify_mediation_change();

DROP TRIGGER IF EXISTS room_messages_notify_mediation ON public.room_messages;
CREATE TRIGGER room_messages_notify_mediation
AFTER INSERT OR UPDATE OR DELETE ON public.room_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_mediation_change();

DROP TRIGGER IF EXISTS users_notify_mediation ON public.users;
CREATE TRIGGER users_notify_mediation
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.notify_mediation_change();

DROP TRIGGER IF EXISTS user_test_completions_notify_mediation ON public.user_test_completions;
CREATE TRIGGER user_test_completions_notify_mediation
AFTER INSERT OR UPDATE OR DELETE ON public.user_test_completions
FOR EACH ROW EXECUTE FUNCTION public.notify_mediation_change();
