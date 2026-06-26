import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";
import type { AgentKey } from "@/drizzle/schema";
import {
  parseJsonResponse,
  runAgentCompletion,
  unwrapAgentJsonPayload,
} from "@/lib/pipeline/openai-client";
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

const LEGAL_DOMAIN_OUTPUT_GUIDE = `Respond with a single JSON object containing exactly these keys:
- legalDomain (string): area of law
- jurisdiction (string | null): identified jurisdiction, or null if unknown
- applicableNorms (string): summary of applicable legal norms
- needsJurisdictionClarification (boolean): true when participants must clarify jurisdiction
- jurisdictionQuestion (string | null): clarification question for participants, or null`;

function pickString(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNullableString(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (value === null) return null;
    if (typeof value === "string") return value.trim() || null;
  }
  return undefined;
}

function pickBoolean(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return undefined;
}

function normalizeLegalDomainPayload(raw: unknown): unknown {
  const unwrapped = unwrapAgentJsonPayload(raw);
  if (!unwrapped || typeof unwrapped !== "object" || Array.isArray(unwrapped)) {
    return unwrapped;
  }

  const obj = unwrapped as Record<string, unknown>;
  const jurisdiction = pickNullableString(obj, ["jurisdiction"]);
  const needsJurisdictionClarification =
    pickBoolean(obj, ["needsJurisdictionClarification"]) ?? !jurisdiction;

  return {
    legalDomain: pickString(obj, ["legalDomain", "domain", "areaOfLaw", "area_of_law"]) ?? "",
    jurisdiction: jurisdiction ?? null,
    applicableNorms:
      pickString(obj, ["applicableNorms", "norms", "legalNorms", "legal_norms"]) ?? "",
    needsJurisdictionClarification,
    jurisdictionQuestion: pickNullableString(obj, ["jurisdictionQuestion"]) ?? null,
  };
}

function parseLegalDomainOutput(raw: string) {
  const parsed = normalizeLegalDomainPayload(parseJsonResponse(raw));
  return legalDomainOutputSchema.safeParse(parsed);
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
  const userMessage = `${JSON.stringify(payload, null, 2)}\n\n${LEGAL_DOMAIN_OUTPUT_GUIDE}`;

  const raw = await runAgentCompletion({
    systemPrompt,
    userMessage,
    jsonMode: true,
  });

  let result = parseLegalDomainOutput(raw);
  if (!result.success) {
    const retryRaw = await runAgentCompletion({
      systemPrompt,
      userMessage: `${userMessage}\n\nYour previous JSON failed validation (${result.error.message}). Return only the corrected JSON object.`,
      jsonMode: true,
    });
    result = parseLegalDomainOutput(retryRaw);
  }

  if (!result.success) {
    throw result.error;
  }

  const output = result.data;
  if (!output.legalDomain.trim()) {
    output.legalDomain = "General civil dispute";
  }
  if (!output.applicableNorms.trim()) {
    output.applicableNorms = "To be determined based on jurisdiction and facts.";
  }

  return output;
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
