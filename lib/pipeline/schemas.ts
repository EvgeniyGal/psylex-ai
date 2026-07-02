import { z } from "zod";

export const psychodynamicProfileSchema = z.object({
  summary: z.string(),
  traits: z.array(z.string()),
  attachmentStyle: z.string().nullable().optional(),
  defenseMechanisms: z.array(z.string()).optional().default([]),
  relationalPatterns: z.array(z.string()).optional().default([]),
});

export const emotionalTriggersSchema = z.object({
  triggers: z.array(
    z.object({
      label: z.string(),
      description: z.string(),
      intensity: z.enum(["low", "medium", "high"]),
    }),
  ),
  summary: z.string(),
});

export const interestsAnalysisSchema = z.object({
  conflictingInterests: z.array(
    z.object({
      side: z.enum(["side1", "side2"]),
      interest: z.string(),
      rationale: z.string(),
    }),
  ),
  commonGround: z.array(z.string()),
  summary: z.string(),
});

export const legalAnalysisSchema = z.object({
  applicableLaws: z.array(
    z.object({
      name: z.string(),
      summary: z.string(),
      relevance: z.string(),
    }),
  ),
  regulations: z.array(
    z.object({
      name: z.string(),
      summary: z.string(),
    }),
  ),
  analysis: z.string(),
  citations: z.array(
    z.object({
      documentName: z.string(),
      excerpt: z.string(),
      sourceUrl: z.string().nullable().optional(),
    }),
  ),
});

export type PsychodynamicProfile = z.infer<typeof psychodynamicProfileSchema>;
export type EmotionalTriggers = z.infer<typeof emotionalTriggersSchema>;
export type InterestsAnalysis = z.infer<typeof interestsAnalysisSchema>;
export type LegalAnalysis = z.infer<typeof legalAnalysisSchema>;

export const agentOutputSchemas = {
  psychodynamic: psychodynamicProfileSchema,
  interests: interestsAnalysisSchema,
  emotional_triggers: emotionalTriggersSchema,
  legal_analysis: legalAnalysisSchema,
} as const;
