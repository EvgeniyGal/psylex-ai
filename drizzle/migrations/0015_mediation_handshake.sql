ALTER TABLE "rooms" ADD COLUMN "side1_mediation_start_clicked_at" timestamp with time zone;
ALTER TABLE "rooms" ADD COLUMN "side2_mediation_start_clicked_at" timestamp with time zone;
ALTER TABLE "rooms" ADD COLUMN "mediation_started_at" timestamp with time zone;
ALTER TABLE "rooms" ADD COLUMN "mediation_duration_minutes" integer DEFAULT 20 NOT NULL;
