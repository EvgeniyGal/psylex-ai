import { z } from "zod";
import type { AgentKey } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";

export const legalDomainClarificationRequestSchema = z.object({
  userId: z.string(),
  needed: z.boolean(),
  question: z.string().nullable(),
});

export const legalDomainOutputSchema = z.object({
  legalDomain: z.string(),
  jurisdiction: z.string().nullable(),
  applicableNorms: z.string(),
  needsJurisdictionClarification: z.boolean(),
  jurisdictionQuestion: z.string().nullable(),
  sideClarifications: z.array(legalDomainClarificationRequestSchema).optional(),
});

export const precedentsOutputSchema = z.object({
  precedents: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      relevance: z.string(),
    }),
  ),
});

export const compatibilityOutputSchema = z.object({
  frictionPoints: z.array(z.string()),
  commonGround: z.array(z.string()),
  summary: z.string(),
});

export const resolutionOptionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  terms: z.array(z.string()),
});

export const synthesisOptionsOutputSchema = z.object({
  options: z.array(resolutionOptionSchema).length(3),
});

export const synthesisClarificationOutputSchema = z.object({
  needsClarification: z.boolean(),
  question: z.string().nullable(),
  sideComplete: z.boolean(),
});

export const localizedContentSchema = z.object({
  en: z.string(),
  uk: z.string(),
});

export type LegalDomainOutput = z.infer<typeof legalDomainOutputSchema>;
export type LegalDomainClarificationRequest = z.infer<
  typeof legalDomainClarificationRequestSchema
>;

export type LegalDomainSideInput = {
  userId: string;
  role: string;
  situation: {
    whatHappened: string;
    whyDispute: string;
    supportingInfo: string;
  } | null;
  priorClarifications: Array<{ question: string; answer: string }>;
};
export type PrecedentsOutput = z.infer<typeof precedentsOutputSchema>;
export type CompatibilityOutput = z.infer<typeof compatibilityOutputSchema>;
export type ResolutionOption = z.infer<typeof resolutionOptionSchema>;
export type LocalizedContent = z.infer<typeof localizedContentSchema>;

export type ClarificationStatus = Record<
  string,
  { complete: boolean; round: number }
>;

export type PendingInput =
  | { type: "jurisdiction"; waitingUserIds: string[] }
  | { type: "clarification"; userId: string; waitingUserIds?: string[] };

export type SituationInput = {
  userId: string;
  role: string;
  whatHappened: string;
  whyDispute: string;
  supportingInfo: string;
};

export type PsychologicalProfile = {
  userId: string;
  role: string;
  completedTests: string[];
  personalBotPrompt: string;
};

export type PipelineContext = {
  roomId: string;
  situations: SituationInput[];
  profiles: PsychologicalProfile[];
  locales: Record<string, Locale>;
  legalDomain?: LegalDomainOutput | null;
  precedents?: PrecedentsOutput | null;
  compatibility?: CompatibilityOutput | null;
};

export type AgentRunOptions = {
  agentKey: AgentKey;
  systemPrompt: string;
  userMessage: string;
  targetLocale?: Locale;
  jsonMode?: boolean;
};

export const OPTIONS_MESSAGE_KIND = "resolution_options" as const;
