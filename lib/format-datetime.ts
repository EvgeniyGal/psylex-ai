import type { Locale } from "@/lib/i18n";

const localeTags: Record<Locale, string> = {
  en: "en-US",
  uk: "uk-UA",
};

export function formatDateTime(value: Date | string, locale: Locale) {
  return new Date(value).toLocaleString(localeTags[locale]);
}
