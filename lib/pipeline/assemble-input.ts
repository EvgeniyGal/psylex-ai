import type { users as usersTable, rooms as roomsTable } from "@/drizzle/schema";
import type { PsychodynamicProfile } from "@/lib/pipeline/schemas";

type UserRow = typeof usersTable.$inferSelect;
type RoomRow = typeof roomsTable.$inferSelect;

export type DisputeIntakeAnswers = {
  disputeDescription: string;
  disputePriority: string;
  disputeAcceptableOutcome: string;
};

export function formatDisputeIntakeAnswers(user: UserRow, roleLabel: string) {
  return [
    `=== ${roleLabel} ===`,
    `Dispute description: ${user.disputeDescription ?? ""}`,
    `Priority: ${user.disputePriority ?? ""}`,
    `Acceptable outcome: ${user.disputeAcceptableOutcome ?? ""}`,
  ].join("\n");
}

export function assemblePsychodynamicInput(user: UserRow) {
  return `Personal bot prompt:\n${user.personalBotPrompt ?? ""}`;
}

export function assembleEmotionalTriggersInput(user: UserRow) {
  return [
    `Personal bot prompt:\n${user.personalBotPrompt ?? ""}`,
    "",
    formatDisputeIntakeAnswers(user, user.role),
  ].join("\n");
}

export function assembleInterestsInput(params: {
  side1: UserRow;
  side2: UserRow;
  side1Profile?: PsychodynamicProfile | null;
  side2Profile?: PsychodynamicProfile | null;
}) {
  const sections = [
    formatDisputeIntakeAnswers(params.side1, "Side 1"),
    "",
    formatDisputeIntakeAnswers(params.side2, "Side 2"),
  ];

  if (params.side1Profile) {
    sections.push("", "Side 1 psychodynamic profile (supplementary):", JSON.stringify(params.side1Profile, null, 2));
  }
  if (params.side2Profile) {
    sections.push("", "Side 2 psychodynamic profile (supplementary):", JSON.stringify(params.side2Profile, null, 2));
  }

  return sections.join("\n");
}

export function assembleLegalAnalysisDisputeInput(params: {
  room: RoomRow;
  side1: UserRow;
  side2: UserRow;
}) {
  return [
    `Jurisdiction: ${params.room.jurisdiction}`,
    "",
    formatDisputeIntakeAnswers(params.side1, "Side 1"),
    "",
    formatDisputeIntakeAnswers(params.side2, "Side 2"),
  ].join("\n");
}

export function buildLegalSearchQueries(side1: UserRow, side2: UserRow) {
  const combined = [
    side1.disputeDescription,
    side1.disputePriority,
    side2.disputeDescription,
    side2.disputePriority,
  ]
    .filter(Boolean)
    .join(" ");

  const trimmed = combined.trim();
  if (!trimmed) return ["dispute legal rights obligations"];

  if (trimmed.length <= 200) return [trimmed];
  return [trimmed.slice(0, 200), trimmed.slice(200, 400)].filter(Boolean);
}
