import type { ParticipantRole } from "@/lib/participant-roles";

const PSYLEX_LOGIN_PATTERN = /psylex_[a-zA-Z0-9_-]+/g;

export function finalizePersonalBotPrompt(
  prompt: string,
  login: string,
  role: ParticipantRole,
): string {
  const trimmed = prompt.trim();
  if (!trimmed) return trimmed;

  const roleLabel = role;
  let result = trimmed;

  const loginTrimmed = login.trim();
  if (loginTrimmed) {
    result = result.split(loginTrimmed).join(roleLabel);
  }

  return result.replace(PSYLEX_LOGIN_PATTERN, roleLabel);
}
