import type { users as usersTable, rooms as roomsTable } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { partyRoleLabel } from "@/lib/party-labels";
import type { PartyRole } from "@/lib/participant-roles";
import type { PsychodynamicProfile } from "@/lib/pipeline/schemas";
import { formatRoomJurisdiction } from "@/lib/room/jurisdiction";

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

function labelForUser(user: UserRow, locale: Locale) {
  if (user.role === "party_a" || user.role === "party_b") {
    return partyRoleLabel(user.role, locale);
  }
  return user.role;
}

export function assemblePsychodynamicInput(user: UserRow) {
  return `Personal bot prompt:\n${user.personalBotPrompt ?? ""}`;
}

export function assembleEmotionalTriggersInput(user: UserRow, locale: Locale = "en") {
  return [
    `Personal bot prompt:\n${user.personalBotPrompt ?? ""}`,
    "",
    formatDisputeIntakeAnswers(user, labelForUser(user, locale)),
  ].join("\n");
}

export function assembleInterestsInput(params: {
  partyA: UserRow;
  partyB: UserRow;
  partyAProfile?: PsychodynamicProfile | null;
  partyBProfile?: PsychodynamicProfile | null;
  locale?: Locale;
}) {
  const locale = params.locale ?? "en";
  const sections = [
    formatDisputeIntakeAnswers(params.partyA, partyRoleLabel("party_a", locale)),
    "",
    formatDisputeIntakeAnswers(params.partyB, partyRoleLabel("party_b", locale)),
  ];

  if (params.partyAProfile) {
    sections.push(
      "",
      `${partyRoleLabel("party_a", locale)} psychodynamic profile (supplementary):`,
      JSON.stringify(params.partyAProfile, null, 2),
    );
  }
  if (params.partyBProfile) {
    sections.push(
      "",
      `${partyRoleLabel("party_b", locale)} psychodynamic profile (supplementary):`,
      JSON.stringify(params.partyBProfile, null, 2),
    );
  }

  return sections.join("\n");
}

export function assembleLegalAnalysisDisputeInput(params: {
  room: RoomRow;
  partyA: UserRow;
  partyB: UserRow;
  locale?: Locale;
}) {
  const locale = params.locale ?? "en";
  return [
    `Jurisdiction: ${formatRoomJurisdiction(params.room, locale)}`,
    "",
    formatDisputeIntakeAnswers(params.partyA, partyRoleLabel("party_a", locale)),
    "",
    formatDisputeIntakeAnswers(params.partyB, partyRoleLabel("party_b", locale)),
  ].join("\n");
}

export function buildLegalSearchQueries(partyA: UserRow, partyB: UserRow) {
  const combined = [
    partyA.disputeDescription,
    partyA.disputePriority,
    partyB.disputeDescription,
    partyB.disputePriority,
  ]
    .filter(Boolean)
    .join(" ");

  const trimmed = combined.trim();
  if (!trimmed) return ["dispute legal rights obligations"];

  if (trimmed.length <= 200) return [trimmed];
  return [trimmed.slice(0, 200), trimmed.slice(200, 400)].filter(Boolean);
}

export type { PartyRole };
