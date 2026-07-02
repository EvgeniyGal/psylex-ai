DO $$ BEGIN
 CREATE TYPE "public"."room_jurisdiction" AS ENUM('ukraine', 'usa');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "jurisdiction" "room_jurisdiction" DEFAULT 'ukraine' NOT NULL;
