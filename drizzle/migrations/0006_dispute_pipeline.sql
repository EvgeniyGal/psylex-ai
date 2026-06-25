CREATE TYPE "public"."preferred_locale" AS ENUM('en', 'uk');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('shared', 'private');--> statement-breakpoint
CREATE TYPE "public"."message_sender_type" AS ENUM('participant', 'agent');--> statement-breakpoint
CREATE TYPE "public"."pipeline_status" AS ENUM('awaiting_situations', 'pipeline_running', 'awaiting_clarification', 'options_published', 'post_resolution');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_locale" "preferred_locale" DEFAULT 'en' NOT NULL;--> statement-breakpoint
CREATE TABLE "room_pipeline_states" (
	"room_id" uuid PRIMARY KEY NOT NULL,
	"status" "pipeline_status" DEFAULT 'awaiting_situations' NOT NULL,
	"legal_domain" text,
	"jurisdiction" text,
	"applicable_norms" text,
	"case_law_results" jsonb,
	"compatibility_analysis" jsonb,
	"clarification_status" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_agent" text,
	"pending_input" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "situation_descriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"what_happened" text NOT NULL,
	"why_dispute" text NOT NULL,
	"supporting_info" text DEFAULT '' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "situation_descriptions_room_user_unique" UNIQUE("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "room_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"channel" "message_channel" NOT NULL,
	"participant_user_id" uuid,
	"sender_type" "message_sender_type" NOT NULL,
	"sender_agent" text,
	"sender_user_id" uuid,
	"content" text NOT NULL,
	"content_by_locale" jsonb,
	"message_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_prompts" (
	"agent_key" text PRIMARY KEY NOT NULL,
	"system_prompt" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_event_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"agent_key" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_pipeline_states" ADD CONSTRAINT "room_pipeline_states_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situation_descriptions" ADD CONSTRAINT "situation_descriptions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "situation_descriptions" ADD CONSTRAINT "situation_descriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_participant_user_id_users_id_fk" FOREIGN KEY ("participant_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_event_logs" ADD CONSTRAINT "pipeline_event_logs_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "agent_prompts" ("agent_key", "system_prompt") VALUES
('legal_domain', 'You are a legal domain classification agent. Analyze dispute situation descriptions and determine the area of law, jurisdiction, and applicable legal norms. Respond in JSON: { "legalDomain": string, "jurisdiction": string | null, "applicableNorms": string, "needsJurisdictionClarification": boolean, "jurisdictionQuestion": string | null }'),
('precedents', 'You are a case law research agent. Given legal domain and dispute facts, summarize relevant precedents and judicial practice. Respond in JSON: { "precedents": [{ "title": string, "summary": string, "relevance": string }] }'),
('compatibility', 'You are a psychological compatibility analyst. Given psychological profiles and dispute descriptions, assess compatibility, friction points, and common ground. Respond in JSON: { "frictionPoints": string[], "commonGround": string[], "summary": string }'),
('synthesis', 'You are a dispute resolution synthesis agent. Combine legal, precedent, and compatibility analysis to clarify missing facts and propose balanced resolution options. Follow the requested mode in the user message.')
ON CONFLICT ("agent_key") DO NOTHING;
