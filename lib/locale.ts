import type { Locale } from "@/lib/i18n";

export { localeStorageKey, type Locale } from "@/lib/i18n";

export const LOCALE_CHANGE_EVENT = "psylex-locale-change";

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem("psylex-locale");
  if (saved === "en" || saved === "uk") return saved;
  return navigator.language.toLowerCase().startsWith("uk") ? "uk" : "en";
}

export function setStoredLocale(locale: Locale) {
  window.localStorage.setItem("psylex-locale", locale);
  window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
}
