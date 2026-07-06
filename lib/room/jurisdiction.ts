import type { Locale } from "@/lib/i18n";
import { getUsaSubJurisdictionLabel, isUsaSubJurisdiction } from "@/lib/rag/usa-jurisdictions";

export const ROOM_JURISDICTIONS = ["ukraine", "usa"] as const;

export type RoomJurisdiction = (typeof ROOM_JURISDICTIONS)[number];

export function isRoomJurisdiction(value: string): value is RoomJurisdiction {
  return (ROOM_JURISDICTIONS as readonly string[]).includes(value);
}

export function jurisdictionLabels(locale: Locale): Record<RoomJurisdiction, string> {
  if (locale === "uk") {
    return {
      ukraine: "Україна",
      usa: "США",
    };
  }
  return {
    ukraine: "Ukraine",
    usa: "United States",
  };
}

export function formatRoomJurisdiction(
  room: { jurisdiction: RoomJurisdiction; usaSubJurisdiction?: string | null },
  locale: Locale,
): string {
  const base = jurisdictionLabels(locale)[room.jurisdiction];
  if (
    room.jurisdiction === "usa" &&
    room.usaSubJurisdiction &&
    isUsaSubJurisdiction(room.usaSubJurisdiction)
  ) {
    return `${base} (${getUsaSubJurisdictionLabel(room.usaSubJurisdiction, locale)})`;
  }
  return base;
}
