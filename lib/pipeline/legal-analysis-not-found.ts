import type { Locale } from "@/lib/i18n";
import type { LegalAnalysis } from "@/lib/pipeline/schemas";

const notFoundMessage: Record<Locale, string> = {
  en: "No relevant legal information was found in the available documents for this dispute based on the information provided. There is currently no document or other available source in the corpus that describes how to resolve this conflict. No legal analysis, recommendations, or conclusions can be provided without supporting sources.",
  uk: "У доступних документах не знайдено релевантної правової інформації для цього спору на основі наданих даних. Наразі немає документа чи іншого доступного джерела в корпусі, яке описує спосіб вирішення цього конфлікту. Без підтверджених джерел правовий аналіз, рекомендації чи висновки надати неможливо.",
};

export const LEGAL_ANALYSIS_STRICT_RULES = `STRICT RULES:
- Answer ONLY using the retrieved legal excerpts provided in the user message.
- Do NOT use outside knowledge, general legal training, or assumptions.
- Do NOT invent citations, laws, regulations, or legal conclusions that are not supported by the excerpts.
- If the excerpts are empty or do not contain enough information to analyze the dispute, set "status" to "not_found", set "applicableLaws", "regulations", and "citations" to empty arrays, and write a clear explanation in "analysis" that no relevant information was found.
- When "status" is "found", every citation must reference a document from the retrieved excerpts.`;

export const LEGAL_ANALYSIS_DEFAULT_PROMPT = `You are a legal analysis agent. Given dispute facts and retrieved legal excerpts, produce applicable laws and regulations with citations grounded ONLY in the excerpts.

Respond ONLY with valid JSON:
{
  "status": "found" | "not_found",
  "applicableLaws": [{ "name": string, "summary": string, "relevance": string }],
  "regulations": [{ "name": string, "summary": string }],
  "analysis": string,
  "citations": [{ "documentName": string, "excerpt": string, "sourceUrl": string | null }]
}`;

export function getLegalAnalysisNotFoundMessage(locale: Locale = "en") {
  return notFoundMessage[locale];
}

export function buildNotFoundLegalAnalysis(locale: Locale): LegalAnalysis {
  return {
    status: "not_found",
    applicableLaws: [],
    regulations: [],
    analysis: getLegalAnalysisNotFoundMessage(locale),
    citations: [],
  };
}

export function isLegalAnalysisNotFound(result: unknown): result is LegalAnalysis & { status: "not_found" } {
  if (!result || typeof result !== "object") return false;
  const record = result as LegalAnalysis;
  return record.status === "not_found";
}
