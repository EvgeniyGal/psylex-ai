import type { MediationOption } from "@/lib/mediation/types";
import type { PartyRole } from "@/lib/participant-roles";

export type QuestionCandidate = {
  id: string;
  canonicalContent: string;
  partyA: string;
  partyB: string;
};

export type MediatorQuestionCandidates = {
  party_a: QuestionCandidate[];
  party_b: QuestionCandidate[];
};

export type PartyNotificationType =
  | "session_scheduled"
  | "start_window_open"
  | "peer_ready"
  | "session_started"
  | "question_received"
  | "options_ready"
  | "compromise_ready"
  | "agreement_ready"
  | "session_completed";

export type PartyNotification = {
  id: string;
  type: PartyNotificationType;
  targetRole?: PartyRole | "all";
  at: string;
  payload?: Record<string, unknown>;
};

export type MediatorCompromiseDraft = MediationOption;
