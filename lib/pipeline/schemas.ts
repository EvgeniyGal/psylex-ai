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

const legalCitationSchema = z.object({
  documentName: z.string(),
  excerpt: z.string(),
  sourceUrl: z.string().nullable().optional(),
});

export const legalAnalysisSchema = z
  .object({
    status: z.enum(["found", "not_found"]).default("found"),
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
    citations: z.array(legalCitationSchema),
  })
  .superRefine((data, ctx) => {
    if (data.status !== "not_found") return;

    if (data.applicableLaws.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "applicableLaws must be empty when status is not_found",
        path: ["applicableLaws"],
      });
    }
    if (data.regulations.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "regulations must be empty when status is not_found",
        path: ["regulations"],
      });
    }
    if (data.citations.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "citations must be empty when status is not_found",
        path: ["citations"],
      });
    }
    if (!data.analysis.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "analysis must explain that no relevant information was found",
        path: ["analysis"],
      });
    }
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
