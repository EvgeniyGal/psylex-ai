DROP TABLE IF EXISTS "pipeline_event_logs";
DROP TABLE IF EXISTS "room_messages";
DROP TABLE IF EXISTS "situation_descriptions";
DROP TABLE IF EXISTS "agent_prompts";
DROP TABLE IF EXISTS "room_pipeline_states";
--> statement-breakpoint
DROP TYPE IF EXISTS "pipeline_status";
DROP TYPE IF EXISTS "message_channel";
DROP TYPE IF EXISTS "message_sender_type";
--> statement-breakpoint
ALTER TABLE "platform_settings" DROP COLUMN IF EXISTS "legal_data_hunter_api_key";
