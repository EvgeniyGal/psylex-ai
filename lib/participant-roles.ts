export const PARTICIPANT_ROLES = ["mediator", "side1", "side2"] as const;

export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export function isParticipantRole(role: string): role is ParticipantRole {
  return PARTICIPANT_ROLES.includes(role as ParticipantRole);
}
