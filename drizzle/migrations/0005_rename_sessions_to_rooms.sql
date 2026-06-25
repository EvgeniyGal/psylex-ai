ALTER TABLE "sessions" RENAME TO "rooms";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "session_id" TO "room_id";--> statement-breakpoint
ALTER TABLE "users" RENAME CONSTRAINT "users_session_id_sessions_id_fk" TO "users_room_id_rooms_id_fk";--> statement-breakpoint
ALTER TYPE "user_role" RENAME VALUE 'plaintiff' TO 'side1';--> statement-breakpoint
ALTER TYPE "user_role" RENAME VALUE 'defendant' TO 'side2';
