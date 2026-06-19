import type { ParticipantRole } from "@/lib/participant-roles";

export function finalizePersonalBotPrompt(
  prompt: string,
  login: string,
  role: ParticipantRole,
): string {
  const trimmed = prompt.trim();
  if (!trimmed || !login.trim()) return trimmed;

  return trimmed.split(login).join(role);
}
