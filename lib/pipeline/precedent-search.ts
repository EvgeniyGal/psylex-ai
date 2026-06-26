import { hitsToPrecedents, searchCaseLaw } from "@/lib/pipeline/legal-data-hunter";

export type PrecedentSearchResult = {
  title: string;
  summary: string;
  relevance: string;
  source?: string;
  sourceId?: string;
  url?: string | null;
};

function buildSearchQuery(legalDomain: string, summary: string) {
  return [legalDomain, summary].filter(Boolean).join(" ").slice(0, 500);
}

function stubPrecedents(
  legalDomain: string,
  jurisdiction: string | null,
  summary: string,
): PrecedentSearchResult[] {
  return [
    {
      title: `Sample precedent — ${legalDomain}`,
      summary: `Illustrative judicial practice for disputes involving: ${summary.slice(0, 120)}…`,
      relevance: jurisdiction
        ? `Applicable under ${jurisdiction} jurisdiction (stub — configure Legal Data Hunter API key in admin settings).`
        : "General relevance pending jurisdiction confirmation (stub data).",
    },
  ];
}

export async function searchPrecedents(
  legalDomain: string,
  jurisdiction: string | null,
  summary: string,
): Promise<PrecedentSearchResult[]> {
  const query = buildSearchQuery(legalDomain, summary);

  try {
    const hits = await searchCaseLaw({
      query,
      jurisdiction,
      topK: 8,
      language: jurisdiction && /україн|ukrain/i.test(jurisdiction) ? "uk" : undefined,
    });

    if (hits.length === 0) {
      return stubPrecedents(legalDomain, jurisdiction, summary);
    }

    return hitsToPrecedents(hits);
  } catch (error) {
    console.error("[precedents] Legal Data Hunter search failed:", error);
    return stubPrecedents(legalDomain, jurisdiction, summary);
  }
}

export function enrichPrecedentsPrompt(results: PrecedentSearchResult[]) {
  return JSON.stringify(
    {
      provider: "Legal Data Hunter",
      externalPrecedents: results,
    },
    null,
    2,
  );
}
