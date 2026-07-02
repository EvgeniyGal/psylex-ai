import type { LegalDocumentCategory } from "@/lib/rag/types";

const DOMAIN_KEYWORDS: Record<LegalDocumentCategory, string[]> = {
  labor: ["labor", "employment", "трудов", "праці", "зайнят"],
  family: ["family", "marriage", "divorce", "сімей", "шлюб", "розлуч"],
  contract: ["contract", "agreement", "договор", "договір", "угод"],
  property: ["property", "real estate", "імуществ", "майнов", "нерухом"],
  consumer: ["consumer", "потребит", "спожив"],
  corporate: ["corporate", "company", "корпоратив", "компан"],
  insurance: ["insurance", "страхов", "страхув"],
  odr_international: ["odr", "international", "международ", "міжнарод", "arbitration", "арбітраж"],
};

export function mapLegalDomainToCategory(legalDomain: string): LegalDocumentCategory | undefined {
  const normalized = legalDomain.toLowerCase().trim();
  if (!normalized) return undefined;

  let best: LegalDocumentCategory | undefined;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(DOMAIN_KEYWORDS) as [LegalDocumentCategory, string[]][]) {
    const score = keywords.reduce((total, keyword) => (normalized.includes(keyword) ? total + 1 : total), 0);
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  return bestScore > 0 ? best : undefined;
}
