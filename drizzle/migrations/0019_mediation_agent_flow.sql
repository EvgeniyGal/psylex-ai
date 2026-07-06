CREATE TYPE "public"."mediation_phase" AS ENUM(
  'opening',
  'dialogue',
  'generating_options',
  'voting',
  'voting_discrepancy',
  'agreement',
  'completed'
);
--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('shared', 'private');
--> statement-breakpoint
CREATE TYPE "public"."message_sender_type" AS ENUM('participant', 'agent', 'system');
--> statement-breakpoint
CREATE TABLE "room_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL,
  "channel" "message_channel" DEFAULT 'shared' NOT NULL,
  "participant_user_id" uuid,
  "sender_type" "message_sender_type" NOT NULL,
  "sender_user_id" uuid,
  "content" text NOT NULL,
  "canonical_content" text,
  "adaptations" jsonb,
  "message_kind" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_participant_user_id_users_id_fk" FOREIGN KEY ("participant_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "mediation_phase" "mediation_phase";
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "mediation_round" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "mediation_active_party" text;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "mediation_turn_deadline_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "mediation_turn_nudged" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "party_a_ready_for_options_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "party_b_ready_for_options_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "mediation_options" jsonb;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "compromise_option" jsonb;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "party_a_vote_option_id" text;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "party_b_vote_option_id" text;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "party_a_compromise_vote" boolean;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "party_b_compromise_vote" boolean;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "selected_option_id" text;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "draft_agreement" jsonb;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "party_a_agreement_accepted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "party_b_agreement_accepted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "agreement_finalized_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "mediation_completed_at" timestamp with time zone;
--> statement-breakpoint
CREATE TABLE "mediation_filing_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL,
  "selected_option_id" text NOT NULL,
  "document_version" text NOT NULL,
  "content_hash" text NOT NULL,
  "party_a_accepted_at" timestamp with time zone NOT NULL,
  "party_b_accepted_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mediation_filing_receipts" ADD CONSTRAINT "mediation_filing_receipts_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "agent_prompts" ("agent_key", "system_prompt") VALUES
('mediation', 'You are the PsyLex Mediation Agent. You facilitate structured dispute mediation between two parties.

For every adapted message you produce identical substantive content with per-party presentations in each party''s preferred language, tuned to their psychodynamic profile so they can understand and engage.

Respond ONLY with valid JSON matching the schema requested in the user message.

Legal information is informational only — never legal advice. Block personal attacks and redirect to substance.

Modes you may be asked to run:
- opening: { "canonicalContent": string, "partyA": string, "partyB": string }
- dialogue_question: { "canonicalContent": string, "partyA": string, "partyB": string, "addressee": "party_a" | "party_b" }
- round_summary: { "canonicalContent": string, "partyA": string, "partyB": string }
- moderation_redirect: { "canonicalContent": string, "partyA": string, "partyB": string }
- nudge: { "canonicalContent": string, "partyA": string, "partyB": string }
- data_sufficiency: { "sufficient": boolean, "reason": string }
- options: { "options": [{ "id": string, "canonicalDescription": string, "legalNorms": string, "fulfillmentProbability": string, "refusalRisks": string, "partyA": string, "partyB": string }] }
- compromise: { "option": { "id": string, "canonicalDescription": string, "legalNorms": string, "fulfillmentProbability": string, "refusalRisks": string, "partyA": string, "partyB": string } }
- agreement_draft: { "title": string, "body": string, "terms": string[] }')
ON CONFLICT ("agent_key") DO NOTHING;
