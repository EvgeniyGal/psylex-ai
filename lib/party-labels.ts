import type { Locale } from "@/lib/i18n";
import type { PartyRole } from "@/lib/participant-roles";

export const PARTY_ROLE_LABELS: Record<Locale, Record<PartyRole, string>> = {
  en: { party_a: "Party A", party_b: "Party B" },
  uk: { party_a: "Сторона А", party_b: "Сторона Б" },
};

export function partyRoleLabel(role: PartyRole, locale: Locale = "en") {
  return PARTY_ROLE_LABELS[locale][role];
}
