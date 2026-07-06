ALTER TYPE "user_role" RENAME VALUE 'side1' TO 'party_a';--> statement-breakpoint
ALTER TYPE "user_role" RENAME VALUE 'side2' TO 'party_b';--> statement-breakpoint
ALTER TABLE "rooms" RENAME COLUMN "side1_mediation_start_clicked_at" TO "party_a_mediation_start_clicked_at";--> statement-breakpoint
ALTER TABLE "rooms" RENAME COLUMN "side2_mediation_start_clicked_at" TO "party_b_mediation_start_clicked_at";--> statement-breakpoint
UPDATE "rooms"
SET "interests_analysis" = jsonb_set(
  "interests_analysis",
  '{conflictingInterests}',
  COALESCE(
    (
      SELECT jsonb_agg(
        CASE
          WHEN elem->>'side' = 'side1' THEN jsonb_set(elem, '{side}', '"party_a"'::jsonb)
          WHEN elem->>'side' = 'side2' THEN jsonb_set(elem, '{side}', '"party_b"'::jsonb)
          ELSE elem
        END
      )
      FROM jsonb_array_elements("interests_analysis"->'conflictingInterests') AS elem
    ),
    '[]'::jsonb
  )
)
WHERE "interests_analysis" IS NOT NULL
  AND jsonb_typeof("interests_analysis"->'conflictingInterests') = 'array';--> statement-breakpoint
UPDATE "agent_prompts"
SET "system_prompt" = REPLACE(
  REPLACE("system_prompt", '"side1"', '"party_a"'),
  '"side2"',
  '"party_b"'
)
WHERE "agent_key" = 'interests';
