import type { Locale } from "@/lib/i18n";
import type { LegalAnalysis } from "@/lib/pipeline/schemas";
import { legalAnalysisSchema } from "@/lib/pipeline/schemas";
import { resolveLocalizedOutput } from "@/lib/pipeline/locale";
import { portalCopy } from "@/lib/portal-i18n";
import { formatRoomJurisdiction, type RoomJurisdiction } from "@/lib/room/jurisdiction";

export type LegislationLawItem = {
  name: string;
  summary: string;
  relevance: string;
};

export type LegislationRegulationItem = {
  name: string;
  summary: string;
};

export type LegislationCitationItem = {
  documentName: string;
  excerpt: string;
  sourceUrl?: string | null;
};

export type LegislationContentSection = {
  heading: string;
  body: string;
  kind: "text" | "laws" | "regulations" | "citations";
  laws?: LegislationLawItem[];
  regulations?: LegislationRegulationItem[];
  citations?: LegislationCitationItem[];
};

function normalizeLegalAnalysis(raw: unknown, locale: Locale): LegalAnalysis | null {
  const localized = resolveLocalizedOutput<LegalAnalysis>(raw, locale);
  const candidate = localized ?? raw;

  if (!candidate || typeof candidate !== "object") return null;

  const parsed = legalAnalysisSchema.safeParse(candidate);
  if (parsed.success) return parsed.data;

  const obj = candidate as Record<string, unknown>;
  const applicableLaws = Array.isArray(obj.applicableLaws)
    ? obj.applicableLaws.filter(
        (item): item is LegislationLawItem =>
          !!item &&
          typeof item === "object" &&
          typeof (item as { name?: string }).name === "string" &&
          typeof (item as { summary?: string }).summary === "string" &&
          typeof (item as { relevance?: string }).relevance === "string",
      )
    : [];

  const regulations = Array.isArray(obj.regulations)
    ? obj.regulations.filter(
        (item): item is LegislationRegulationItem =>
          !!item &&
          typeof item === "object" &&
          typeof (item as { name?: string }).name === "string" &&
          typeof (item as { summary?: string }).summary === "string",
      )
    : [];

  const citations = Array.isArray(obj.citations)
    ? obj.citations.filter(
        (item): item is LegislationCitationItem =>
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

function formatLawBody(laws: LegislationLawItem[], relevanceLabel: string): string {
  return laws
    .map((law) => [law.name, law.summary, `${relevanceLabel}: ${law.relevance}`].join("\n"))
    .join("\n\n");
}

function formatRegulationBody(regulations: LegislationRegulationItem[]): string {
  return regulations.map((regulation) => `${regulation.name}\n${regulation.summary}`).join("\n\n");
}

function formatCitationBody(
  citations: LegislationCitationItem[],
  sourceLabel: string,
  excerptLabel: string,
): string {
  return citations
    .map((citation) => {
      const source = citation.sourceUrl ? `\n${sourceLabel}: ${citation.sourceUrl}` : "";
      return `${citation.documentName}\n${excerptLabel}:\n${citation.excerpt}${source}`;
    })
    .join("\n\n");
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
  const analysis = normalizeLegalAnalysis(params.room.legalAnalysis, params.locale);

  sections.push({
    heading: copy.mediationLegislationJurisdiction,
    body: formatRoomJurisdiction(params.room, params.locale),
    kind: "text",
  });

  if (!analysis) {
    if (params.optionLegalNorms?.trim()) {
      sections.push({
        heading: copy.mediationLegislationSolutionNorms,
        body: params.optionLegalNorms.trim(),
        kind: "text",
      });
    }
    return sections;
  }

  if (analysis.status === "not_found") {
    if (analysis.analysis.trim()) {
      sections.push({
        heading: copy.mediationLegislationOverview,
        body: analysis.analysis.trim(),
        kind: "text",
      });
    }
    return sections;
  }

  if (analysis.analysis.trim()) {
    sections.push({
      heading: copy.mediationLegislationOverview,
      body: analysis.analysis.trim(),
      kind: "text",
    });
  }

  if (analysis.applicableLaws.length > 0) {
    sections.push({
      heading: copy.mediationLegislationApplicableLaws,
      body: formatLawBody(analysis.applicableLaws, copy.mediationLegislationRelevance),
      kind: "laws",
      laws: analysis.applicableLaws,
    });
  }

  if (analysis.regulations.length > 0) {
    sections.push({
      heading: copy.mediationLegislationRegulations,
      body: formatRegulationBody(analysis.regulations),
      kind: "regulations",
      regulations: analysis.regulations,
    });
  }

  if (analysis.citations.length > 0) {
    sections.push({
      heading: copy.mediationLegislationCitations,
      body: formatCitationBody(
        analysis.citations,
        copy.mediationLegislationSource,
        copy.mediationLegislationExcerpt,
      ),
      kind: "citations",
      citations: analysis.citations,
    });
  }

  if (params.optionLegalNorms?.trim()) {
    sections.push({
      heading: copy.mediationLegislationSolutionNorms,
      body: params.optionLegalNorms.trim(),
      kind: "text",
    });
  }

  return sections;
}

export function formatLegislationSections(sections: LegislationContentSection[]): string {
  return sections.map((section) => `${section.heading}\n${section.body}`).join("\n\n");
}
