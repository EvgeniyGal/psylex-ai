import { z } from "zod";

const adaptedMessageSchema = z.object({
  canonicalContent: z.string(),
  partyA: z.string(),
  partyB: z.string(),
});

const adaptedQuestionSchema = adaptedMessageSchema.extend({
  addressee: z.enum(["party_a", "party_b"]),
});

export const mediationOpeningSchema = adaptedMessageSchema;
export const mediationDialogueQuestionSchema = adaptedQuestionSchema;
export const mediationRoundSummarySchema = adaptedMessageSchema;
export const mediationModerationSchema = adaptedMessageSchema;
export const mediationNudgeSchema = adaptedMessageSchema;

const questionCandidateSchema = z.object({
  id: z.string(),
  canonicalContent: z.string(),
  partyA: z.string(),
  partyB: z.string(),
});

export const mediationQuestionCandidatesSchema = z.object({
  partyA: z.object({
    candidates: z.array(questionCandidateSchema).length(3),
  }),
  partyB: z.object({
    candidates: z.array(questionCandidateSchema).length(3),
  }),
});

const mediationOptionSchema = z.object({
  id: z.string(),
  canonicalDescription: z.string(),
  legalNorms: z.string(),
  fulfillmentProbability: z.string(),
  refusalRisks: z.string(),
  partyA: z.string(),
  partyB: z.string(),
});

export const mediationOptionsSchema = z.object({
  options: z.array(mediationOptionSchema).min(2).max(3),
});

export const mediationCompromiseSchema = z.object({
  option: mediationOptionSchema,
});

export const mediationAgreementDraftSchema = z.object({
  title: z.string(),
  body: z.string(),
  terms: z.array(z.string()),
});

export type MediationOpening = z.infer<typeof mediationOpeningSchema>;
export type MediationDialogueQuestion = z.infer<typeof mediationDialogueQuestionSchema>;
export type MediationRoundSummary = z.infer<typeof mediationRoundSummarySchema>;
export type MediationQuestionCandidates = z.infer<typeof mediationQuestionCandidatesSchema>;
export type MediationOptionsOutput = z.infer<typeof mediationOptionsSchema>;
export type MediationCompromiseOutput = z.infer<typeof mediationCompromiseSchema>;
export type MediationAgreementDraft = z.infer<typeof mediationAgreementDraftSchema>;

export type MediationAgentMode =
  | "opening"
  | "dialogue_question"
  | "question_candidates"
  | "round_summary"
  | "moderation_redirect"
  | "nudge"
  | "options"
  | "compromise"
  | "agreement_draft";

export const mediationModeInstructions: Record<MediationAgentMode, string> = {
  opening:
    'Run mode "opening". Present the dispute situation to both parties with identical substance and per-party adapted text.',
  dialogue_question:
    'Run mode "dialogue_question". Ask one structured question to the addressee party. Include "addressee": "party_a" | "party_b".',
  question_candidates:
    'Run mode "question_candidates". Generate exactly three candidate questions for party_a and exactly three for party_b. Tailor each candidate using psychodynamic profiles, emotional triggers, interests, and legal analysis. Each candidate must include canonicalContent, partyA, and partyB adapted text plus a stable id string.',
  round_summary:
    'Run mode "round_summary". Summarize what was heard from both parties this round.',
  moderation_redirect:
    'Run mode "moderation_redirect". Redirect the party away from personal attacks toward substance.',
  nudge: 'Run mode "nudge". Gently prompt the party to respond to the current question.',
  options:
    'Run mode "options". Generate 2-3 solution options with legal information (not advice), fulfillment probability, refusal risks, and per-party presentations.',
  compromise:
    'Run mode "compromise". Generate exactly one compromise option informed by the parties\' votes.',
  agreement_draft:
    'Run mode "agreement_draft". Generate a draft voluntary agreement document from the selected option.',
};
