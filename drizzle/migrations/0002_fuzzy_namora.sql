CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"openai_api_key" text DEFAULT '' NOT NULL,
	"airtable_api_key" text DEFAULT '' NOT NULL,
	"test_personality_type_url" text DEFAULT '' NOT NULL,
	"test_face_fear_url" text DEFAULT '' NOT NULL,
	"test_character_traits_url" text DEFAULT '' NOT NULL,
	"test_personality_conflicts_url" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
