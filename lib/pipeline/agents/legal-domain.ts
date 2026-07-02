import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";
import type { AgentKey } from "@/drizzle/schema";
import {
  parseJsonResponse,
  runAgentCompletion,
  unwrapAgentJsonPayload,
} from "@/lib/pipeline/openai-client";
import { getLatestClarificationAnswer } from "@/lib/pipeline/legal-domain-history";
import {
  legalDomainOutputSchema,
  type LegalDomainClarificationRequest,
  type LegalDomainOutput,
  type LegalDomainSideInput,
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

const LEGAL_DOMAIN_OUTPUT_GUIDE = `Analyze ALL participant data below before responding. Each participant entry includes their situation description and full prior clarification history (question/answer pairs).

Respond with a single JSON object containing exactly these keys:
- legalDomain (string): area of law
- jurisdiction (string | null): identified jurisdiction, or null if still unknown
- applicableNorms (string): summary of applicable legal norms
- needsJurisdictionClarification (boolean): true when at least one participant must still clarify
- jurisdictionQuestion (string | null): legacy single question; prefer sideClarifications instead
- sideClarifications (array): one entry per participant in the input, each with:
  - userId (string): must match a participant userId from the input
  - needed (boolean): true only if THIS participant must answer a new targeted question
  - question (string | null): specific question for that participant in English, or null when needed is false

Rules:
- Cross-check both participants' situations and all prior clarifications before asking anything.
- Do not set needed:true for a participant if the information is already stated by either side.
- Ask only the participant(s) who can supply missing facts; tailor each question to what that side has not yet provided.
- If jurisdiction and legal domain can be determined from available data, set jurisdiction and mark every side needed:false.`;

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

function normalizeSideClarifications(raw: unknown): LegalDomainClarificationRequest[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const parsed: LegalDomainClarificationRequest[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const userId = pickString(row, ["userId", "user_id", "participantUserId", "participant_user_id"]);
    if (!userId) continue;

    const needed = pickBoolean(row, ["needed", "needsClarification", "needs_clarification"]) ?? false;
    const question =
      pickNullableString(row, ["question", "jurisdictionQuestion", "jurisdiction_question"]) ?? null;

    parsed.push({ userId, needed, question });
  }

  return parsed.length > 0 ? parsed : undefined;
}

function normalizeLegalDomainPayload(raw: unknown): unknown {
  const unwrapped = unwrapAgentJsonPayload(raw);
  if (!unwrapped || typeof unwrapped !== "object" || Array.isArray(unwrapped)) {
    return unwrapped;
  }

  const obj = unwrapped as Record<string, unknown>;
  const jurisdiction = pickNullableString(obj, ["jurisdiction"]);
  const sideClarifications = normalizeSideClarifications(
    obj.sideClarifications ?? obj.side_clarifications ?? obj.clarificationRequests,
  );
  const needsFromSides = sideClarifications?.some((side) => side.needed) ?? false;
  const needsJurisdictionClarification =
    pickBoolean(obj, ["needsJurisdictionClarification"]) ?? needsFromSides ?? !jurisdiction;

  return {
    legalDomain: pickString(obj, ["legalDomain", "domain", "areaOfLaw", "area_of_law"]) ?? "",
    jurisdiction: jurisdiction ?? null,
    applicableNorms:
      pickString(obj, ["applicableNorms", "norms", "legalNorms", "legal_norms"]) ?? "",
    needsJurisdictionClarification,
    jurisdictionQuestion: pickNullableString(obj, ["jurisdictionQuestion"]) ?? null,
    sideClarifications,
  };
}

function parseLegalDomainOutput(raw: string) {
  const parsed = normalizeLegalDomainPayload(parseJsonResponse(raw));
  return legalDomainOutputSchema.safeParse(parsed);
}

export function resolveSideClarificationRequests(
  result: LegalDomainOutput,
  sides: Array<{ id: string }>,
  participants: LegalDomainSideInput[],
): LegalDomainClarificationRequest[] {
  if (result.sideClarifications?.length) {
    const byUserId = new Map(result.sideClarifications.map((entry) => [entry.userId, entry]));
    return sides.map(
      (side) =>
        byUserId.get(side.id) ?? {
          userId: side.id,
          needed: false,
          question: null,
        },
    );
  }

  if (!result.needsJurisdictionClarification) {
    return sides.map((side) => ({ userId: side.id, needed: false, question: null }));
  }

  const fallbackQuestion = result.jurisdictionQuestion;
  return sides.map((side) => {
    const participant = participants.find((entry) => entry.userId === side.id);
    const hasAnswered = participant ? Boolean(getLatestClarificationAnswer(participant)) : false;
    return {
      userId: side.id,
      needed: !hasAnswered && Boolean(fallbackQuestion?.trim()),
      question: fallbackQuestion,
    };
  });
}

export async function runLegalDomainAgent(
  ctx: PipelineContext,
  participants: LegalDomainSideInput[],
  presetJurisdiction?: string | null,
): Promise<LegalDomainOutput> {
  const systemPrompt = await getAgentPrompt("legal_domain");
  const payload = {
    participants: participants.map((side) => ({
      userId: side.userId,
      role: side.role,
      situation: side.situation,
      priorClarifications: side.priorClarifications,
    })),
    situations: ctx.situations,
    ...(presetJurisdiction ? { presetJurisdiction } : {}),
  };
  const presetGuide = presetJurisdiction
    ? `\nThe room jurisdiction is already set to "${presetJurisdiction}". Use this jurisdiction, do not ask participants to clarify it, and set needsJurisdictionClarification to false for all sides.`
    : "";
  const userMessage = `${JSON.stringify(payload, null, 2)}\n\n${LEGAL_DOMAIN_OUTPUT_GUIDE}${presetGuide}`;

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
