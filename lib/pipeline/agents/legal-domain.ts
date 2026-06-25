import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";
import type { AgentKey } from "@/drizzle/schema";
import { parseJsonResponse, runAgentCompletion } from "@/lib/pipeline/openai-client";
import {
  legalDomainOutputSchema,
  type LegalDomainOutput,
  type PipelineContext,
} from "@/lib/pipeline/types";
import type { Locale } from "@/lib/i18n";

async function getAgentPrompt(agentKey: AgentKey) {
  const [row] = await db
    .select()
    .from(agentPrompts)
    .where(eq(agentPrompts.agentKey, agentKey))
    .limit(1);
  if (!row) throw new Error(`Missing agent prompt: ${agentKey}`);
  return row.systemPrompt;
}

export async function runLegalDomainAgent(
  ctx: PipelineContext,
  jurisdictionAnswers?: Record<string, string>,
): Promise<LegalDomainOutput> {
  const systemPrompt = await getAgentPrompt("legal_domain");
  const payload = {
    situations: ctx.situations,
    jurisdictionAnswers: jurisdictionAnswers ?? {},
  };
  const raw = await runAgentCompletion({
    systemPrompt,
    userMessage: JSON.stringify(payload, null, 2),
    jsonMode: true,
  });
  return legalDomainOutputSchema.parse(parseJsonResponse(raw));
}

export async function formatJurisdictionQuestion(
  question: string,
  locale: Locale,
): Promise<string> {
  if (!question.trim()) {
    return locale === "uk"
      ? "Будь ласка, вкажіть юрисдикцію (країну або регіон), що застосовується до цього спору."
      : "Please specify the jurisdiction (country or region) that applies to this dispute.";
  }
  const systemPrompt = await getAgentPrompt("legal_domain");
  const raw = await runAgentCompletion({
    systemPrompt,
    userMessage: `Translate and return only the question text for the participant:\n${question}`,
    targetLocale: locale,
    jsonMode: false,
  });
  return raw;
}
