ALTER TABLE "rooms" ALTER COLUMN "mediation_duration_minutes" SET DEFAULT 60;
UPDATE "rooms" SET "mediation_duration_minutes" = 60 WHERE "mediation_duration_minutes" = 20;
