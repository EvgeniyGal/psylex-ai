import type { MediationPhase } from "@/lib/mediation/types";

export const PARTICIPANT_FLOW_STEP_COUNT = 6;

export type ParticipantFlowStepId = 0 | 1 | 2 | 3 | 4 | 5;

export const PARTICIPANT_FLOW_STEP_PATHS: Record<ParticipantFlowStepId, string> = {
  0: "/onboarding/welcome",
  1: "/onboarding/consent",
  2: "/onboarding/tests",
  3: "/dispute-intake",
  4: "/room",
  5: "/room",
};

export function isFlowReviewMode(value: string | string[] | undefined): boolean {
  const review = Array.isArray(value) ? value[0] : value;
  return review === "1" || review === "true";
}

export function resolveRoomFlowStep(
  phase: MediationPhase | null | undefined,
  review = false,
): ParticipantFlowStepId {
  if (review) return 4;
  if (phase === "completed") return 5;
  return 4;
}

export function resolveMediationLobbyFlowStep(): ParticipantFlowStepId {
  return 4;
}

export function resolveTestsFlowStep(): ParticipantFlowStepId {
  return 2;
}

export function canNavigateToFlowStep(
  target: ParticipantFlowStepId,
  current: ParticipantFlowStepId,
  maxReachedStep: ParticipantFlowStepId,
): boolean {
  if (target === current) return false;
  if (target > maxReachedStep) return false;
  return true;
}

export function flowStepPathForRail(stepId: ParticipantFlowStepId): string {
  if (stepId === 5) {
    return flowStepPath(5);
  }
  return flowStepPath(stepId, { review: true });
}

export function flowStepPath(
  stepId: ParticipantFlowStepId,
  options?: { review?: boolean },
): string {
  const path = PARTICIPANT_FLOW_STEP_PATHS[stepId];
  if (stepId === 5 || !options?.review) {
    return path;
  }
  return `${path}?review=1`;
}

export function nextReviewStepPath(stepId: ParticipantFlowStepId): string | null {
  if (stepId >= 5) return null;
  const next = (stepId + 1) as ParticipantFlowStepId;
  if (next === 5) return flowStepPath(5);
  return flowStepPath(next, { review: true });
}
