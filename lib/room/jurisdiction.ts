import type { Locale } from "@/lib/i18n";

export const ROOM_JURISDICTIONS = ["ukraine", "usa"] as const;

export type RoomJurisdiction = (typeof ROOM_JURISDICTIONS)[number];

export function isRoomJurisdiction(value: string): value is RoomJurisdiction {
  return (ROOM_JURISDICTIONS as readonly string[]).includes(value);
}

export function jurisdictionToPipelineString(jurisdiction: RoomJurisdiction): string {
  return jurisdiction === "ukraine" ? "Ukraine" : "United States";
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
