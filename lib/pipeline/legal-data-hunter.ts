import { getPlatformSettings } from "@/lib/platform-settings";

const API_BASE = "https://legaldatahunter.com";

export type LegalDataHunterHit = {
  source: string;
  source_id: string;
  score: number;
  title: string;
  snippet: string;
  url?: string;
  country?: string;
  court?: string;
  court_tier?: number;
  date?: string;
  jurisdiction?: string;
  language?: string;
  ecli?: string;
  case_number?: string;
};

type SearchResponse = {
  query: string;
  hits: LegalDataHunterHit[];
  total_hits: number;
  namespace: string;
  elapsed_ms?: number;
};

const COUNTRY_HINTS: { pattern: RegExp; code: string }[] = [
  { pattern: /\bukrain(e|ian)?\b|україн/i, code: "UA" },
  { pattern: /\bpoland\b|polsk/i, code: "PL" },
  { pattern: /\bgerman(y)?\b|deutschland/i, code: "DE" },
  { pattern: /\bfrance\b|français|french/i, code: "FR" },
  { pattern: /\bunited kingdom\b|\buk\b|england|wales|scotland/i, code: "GB" },
  { pattern: /\beuropean union\b|\beu\b/i, code: "EU" },
  { pattern: /\bunited states\b|\busa\b|\bu\.s\./i, code: "US" },
];

export function inferCountryCodes(jurisdiction: string | null): string[] {
  if (!jurisdiction?.trim()) return [];

  const codes = new Set<string>();
  const lower = jurisdiction.toLowerCase();

  for (const { pattern, code } of COUNTRY_HINTS) {
    if (pattern.test(lower)) codes.add(code);
  }

  const isoMatch = jurisdiction.match(/\b([A-Z]{2})\b/);
  if (isoMatch) codes.add(isoMatch[1]);

  return [...codes];
}

export async function searchCaseLaw(params: {
  query: string;
  jurisdiction?: string | null;
  topK?: number;
  language?: string;
}): Promise<LegalDataHunterHit[]> {
  const settings = await getPlatformSettings();
  const apiKey = settings.legalDataHunterApiKey.trim();
  if (!apiKey) return [];

  const country = inferCountryCodes(params.jurisdiction ?? null);
  const body: Record<string, unknown> = {
    q: params.query,
    namespace: "case_law",
    top_k: params.topK ?? 8,
    alpha: 0.7,
  };

  if (country.length > 0) body.country = country;
  if (params.language) body.language = params.language;

  const response = await fetch(`${API_BASE}/v1/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Legal Data Hunter search failed: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as SearchResponse;
  return data.hits ?? [];
}

export function hitsToPrecedents(hits: LegalDataHunterHit[]) {
  return hits.map((hit) => ({
    title: hit.title,
    summary: hit.snippet,
    relevance: [
      hit.jurisdiction ? `Jurisdiction: ${hit.jurisdiction}` : null,
      hit.court ? `Court: ${hit.court}` : null,
      hit.date ? `Date: ${hit.date}` : null,
      hit.ecli ? `ECLI: ${hit.ecli}` : null,
      hit.case_number ? `Case: ${hit.case_number}` : null,
      hit.url ? `Source: ${hit.url}` : null,
      `Relevance score: ${hit.score.toFixed(2)}`,
    ]
      .filter(Boolean)
      .join(" · "),
    source: hit.source,
    sourceId: hit.source_id,
    url: hit.url ?? null,
  }));
}
