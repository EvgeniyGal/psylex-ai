ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "scheduled_start_at" timestamp with time zone;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "mediator_mediation_start_clicked_at" timestamp with time zone;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "mediator_session_started_at" timestamp with time zone;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "mediator_question_candidates" jsonb;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "mediator_compromise_draft" jsonb;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "party_notification" jsonb;
