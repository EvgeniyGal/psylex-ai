import type { Locale } from "@/lib/i18n";
import type { LegalDocumentCategory } from "@/lib/rag/types";

export const LEGAL_DOCUMENT_CATEGORIES = [
  "labor",
  "family",
  "contract",
  "property",
  "consumer",
  "corporate",
  "insurance",
  "odr_international",
] as const satisfies readonly LegalDocumentCategory[];

const CATEGORY_LABELS: Record<Locale, Record<LegalDocumentCategory, string>> = {
  en: {
    labor: "Labor",
    family: "Family",
    contract: "Contract",
    property: "Property",
    consumer: "Consumer",
    corporate: "Corporate",
    insurance: "Insurance",
    odr_international: "ODR / International",
  },
  uk: {
    labor: "Трудовий",
    family: "Сімейний",
    contract: "Договірний",
    property: "Майновий",
    consumer: "Споживчий",
    corporate: "Корпоративний",
    insurance: "Страховий",
    odr_international: "ODR / Міжнародний",
  },
};

export function isLegalDocumentCategory(value: string): value is LegalDocumentCategory {
  return (LEGAL_DOCUMENT_CATEGORIES as readonly string[]).includes(value);
}

export function categoryLabels(locale: Locale): Record<LegalDocumentCategory, string> {
  return CATEGORY_LABELS[locale];
}

export function getCategoryLabel(category: LegalDocumentCategory, locale: Locale): string {
  return CATEGORY_LABELS[locale][category];
}
