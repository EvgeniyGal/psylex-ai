import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/portal-i18n";

const LOCALIZED_SYSTEM_MESSAGE_KEYS = [
  "mediationOptionsReady",
  "modeBSessionStarted",
] as const;

/** Map known system notice text (EN or UK) to the active locale. */
export function resolveLocalizedSystemMessage(
  text: string | null | undefined,
  locale: Locale,
): string {
  if (!text) return "";
  const trimmed = text.trim();
  for (const key of LOCALIZED_SYSTEM_MESSAGE_KEYS) {
    if (trimmed === portalCopy.en[key] || trimmed === portalCopy.uk[key]) {
      return portalCopy[locale][key];
    }
  }
  return text;
}
