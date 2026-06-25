import type { LegalDomainOutput } from "@/lib/pipeline/types";

export async function searchPrecedents(
  legalDomain: string,
  jurisdiction: string | null,
  summary: string,
): Promise<{ title: string; summary: string; relevance: string }[]> {
  return [
    {
      title: `Sample precedent — ${legalDomain}`,
      summary: `Illustrative judicial practice for disputes involving: ${summary.slice(0, 120)}…`,
      relevance: jurisdiction
        ? `Applicable under ${jurisdiction} jurisdiction (stub data for MVP).`
        : "General relevance pending jurisdiction confirmation (stub data for MVP).",
    },
  ];
}

export function enrichPrecedentsPrompt(stub: Awaited<ReturnType<typeof searchPrecedents>>) {
  return JSON.stringify({ externalPrecedents: stub }, null, 2);
}
