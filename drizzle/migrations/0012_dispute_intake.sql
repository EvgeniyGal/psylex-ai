ALTER TABLE "users" ADD COLUMN "dispute_description" text;
ALTER TABLE "users" ADD COLUMN "dispute_priority" text;
ALTER TABLE "users" ADD COLUMN "dispute_acceptable_outcome" text;
ALTER TABLE "users" ADD COLUMN "dispute_intake_submitted_at" timestamp with time zone;
