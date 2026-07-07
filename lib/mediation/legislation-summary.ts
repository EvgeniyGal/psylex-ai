import type { Locale } from "@/lib/i18n";
import type { LegalAnalysis } from "@/lib/pipeline/schemas";
import { legalAnalysisSchema } from "@/lib/pipeline/schemas";
import { portalCopy } from "@/lib/portal-i18n";
import { formatRoomJurisdiction, type RoomJurisdiction } from "@/lib/room/jurisdiction";

export type LegislationContentSection = {
  heading: string;
  body: string;
};

function normalizeLegalAnalysis(raw: unknown): LegalAnalysis | null {
  if (!raw || typeof raw !== "object") return null;

  const parsed = legalAnalysisSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  const obj = raw as Record<string, unknown>;
  const applicableLaws = Array.isArray(obj.applicableLaws)
    ? obj.applicableLaws.filter(
        (item): item is { name: string; summary: string; relevance: string } =>
          !!item &&
          typeof item === "object" &&
          typeof (item as { name?: string }).name === "string" &&
          typeof (item as { summary?: string }).summary === "string" &&
          typeof (item as { relevance?: string }).relevance === "string",
      )
    : [];

  const regulations = Array.isArray(obj.regulations)
    ? obj.regulations.filter(
        (item): item is { name: string; summary: string } =>
          !!item &&
          typeof item === "object" &&
          typeof (item as { name?: string }).name === "string" &&
          typeof (item as { summary?: string }).summary === "string",
      )
    : [];

  const citations = Array.isArray(obj.citations)
    ? obj.citations.filter(
        (item): item is { documentName: string; excerpt: string; sourceUrl?: string | null } =>
          !!item &&
          typeof item === "object" &&
          typeof (item as { documentName?: string }).documentName === "string" &&
          typeof (item as { excerpt?: string }).excerpt === "string",
      )
    : [];

  const analysis = typeof obj.analysis === "string" ? obj.analysis : "";
  const status = obj.status === "not_found" ? "not_found" : "found";

  if (
    !analysis.trim() &&
    applicableLaws.length === 0 &&
    regulations.length === 0 &&
    citations.length === 0
  ) {
    return null;
  }

  return {
    status,
    analysis,
    applicableLaws,
    regulations,
    citations,
  };
}

export function buildLegislationSections(params: {
  locale: Locale;
  room: {
    jurisdiction: RoomJurisdiction;
    usaSubJurisdiction?: string | null;
    legalAnalysis: unknown;
  };
  optionLegalNorms?: string | null;
}): LegislationContentSection[] {
  const copy = portalCopy[params.locale];
  const sections: LegislationContentSection[] = [];
  const analysis = normalizeLegalAnalysis(params.room.legalAnalysis);

  sections.push({
    heading: copy.mediationLegislationJurisdiction,
    body: formatRoomJurisdiction(params.room, params.locale),
  });

  if (params.optionLegalNorms?.trim()) {
    sections.push({
      heading: copy.mediationLegislationSolutionNorms,
      body: params.optionLegalNorms.trim(),
    });
  }

  if (!analysis) {
    if (sections.length === 1 && !params.optionLegalNorms?.trim()) {
      return [];
    }
    return sections;
  }

  if (analysis.status === "not_found") {
    if (analysis.analysis.trim()) {
      sections.push({
        heading: copy.mediationLegislationOverview,
        body: analysis.analysis.trim(),
      });
    }
    return sections;
  }

  if (analysis.analysis.trim()) {
    sections.push({
      heading: copy.mediationLegislationOverview,
      body: analysis.analysis.trim(),
    });
  }

  if (analysis.applicableLaws.length > 0) {
    sections.push({
      heading: copy.mediationLegislationApplicableLaws,
      body: analysis.applicableLaws
        .map((law) =>
          [
            law.name,
            law.summary,
            `${copy.mediationLegislationRelevance}: ${law.relevance}`,
          ].join("\n"),
        )
        .join("\n\n"),
    });
  }

  if (analysis.regulations.length > 0) {
    sections.push({
      heading: copy.mediationLegislationRegulations,
      body: analysis.regulations
        .map((regulation) => `${regulation.name}\n${regulation.summary}`)
        .join("\n\n"),
    });
  }

  if (analysis.citations.length > 0) {
    sections.push({
      heading: copy.mediationLegislationCitations,
      body: analysis.citations
        .map((citation) => {
          const source = citation.sourceUrl
            ? `\n${copy.mediationLegislationSource}: ${citation.sourceUrl}`
            : "";
          return `${citation.documentName}\n${citation.excerpt}${source}`;
        })
        .join("\n\n"),
    });
  }

  return sections;
}

export function formatLegislationSections(sections: LegislationContentSection[]): string {
  return sections.map((section) => `${section.heading}\n${section.body}`).join("\n\n");
}
