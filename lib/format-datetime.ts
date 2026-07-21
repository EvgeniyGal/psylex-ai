import type { Locale } from "@/lib/i18n";

const localeTags: Record<Locale, string> = {
  en: "en-US",
  uk: "uk-UA",
};

export function formatDateTime(value: Date | string, locale: Locale) {
  return new Date(value).toLocaleString(localeTags[locale], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
