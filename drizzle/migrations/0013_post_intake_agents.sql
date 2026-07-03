CREATE TABLE "agent_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_key" text NOT NULL,
	"system_prompt" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_prompts_agent_key_unique" UNIQUE("agent_key")
);
--> statement-breakpoint
CREATE TABLE "pipeline_event_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid,
	"agent_key" text,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "psychodynamic_profile" jsonb;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "psychodynamic_profile_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emotional_triggers" jsonb;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emotional_triggers_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "interests_analysis" jsonb;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "interests_analysis_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "legal_analysis" jsonb;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "legal_analysis_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "post_intake_pipeline_started_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "post_intake_pipeline_completed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "pipeline_event_logs" ADD CONSTRAINT "pipeline_event_logs_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pipeline_event_logs" ADD CONSTRAINT "pipeline_event_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "agent_prompts" ("agent_key", "system_prompt") VALUES
('psychodynamic', 'You are a psychodynamic profiling agent. Given a participant''s personal bot prompt containing psychological characteristics, generate a structured psychodynamic profile. Respond ONLY with valid JSON: { "summary": string, "traits": string[], "attachmentStyle": string | null, "defenseMechanisms": string[], "relationalPatterns": string[] }'),
('interests', 'You are a dispute interests analyst. Given both sides'' answers to three conflict questions, identify conflicting interests and areas of common ground. Respond ONLY with valid JSON: { "conflictingInterests": [{ "side": "side1" | "side2", "interest": string, "rationale": string }], "commonGround": string[], "summary": string }'),
('emotional_triggers', 'You are an emotional triggers analyst. Given a participant''s personal bot prompt and their dispute-intake answers, determine emotional triggers that may escalate the conflict. Respond ONLY with valid JSON: { "triggers": [{ "label": string, "description": string, "intensity": "low" | "medium" | "high" }], "summary": string }'),
('legal_analysis', 'You are a legal analysis agent. Given dispute facts and retrieved legal excerpts, produce applicable laws and regulations with citations grounded ONLY in the excerpts.

Respond ONLY with valid JSON:
{
  "status": "found" | "not_found",
  "applicableLaws": [{ "name": string, "summary": string, "relevance": string }],
  "regulations": [{ "name": string, "summary": string }],
  "analysis": string,
  "citations": [{ "documentName": string, "excerpt": string, "sourceUrl": string | null }]
}

STRICT RULES:
- Answer ONLY using the retrieved legal excerpts provided in the user message.
- Do NOT use outside knowledge, general legal training, or assumptions.
- Do NOT invent citations, laws, regulations, or legal conclusions that are not supported by the excerpts.
- If the excerpts are empty or do not contain enough information to analyze the dispute, set "status" to "not_found", set "applicableLaws", "regulations", and "citations" to empty arrays, and write a clear explanation in "analysis" that no relevant information was found.
- When "status" is "found", every citation must reference a document from the retrieved excerpts.');
