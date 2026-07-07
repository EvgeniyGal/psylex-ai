import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomMessages } from "@/drizzle/schema";
import { resolveAdaptedText } from "@/lib/mediation/assemble-input";
import type { MediationMessageKind, PartyAdaptations } from "@/lib/mediation/types";
import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/portal-i18n";
import type { PartyRole } from "@/lib/participant-roles";

export async function listRoomMessages(roomId: string) {
  return db
    .select()
    .from(roomMessages)
    .where(eq(roomMessages.roomId, roomId))
    .orderBy(asc(roomMessages.createdAt));
}

export function toPartyAdaptations(payload: {
  canonicalContent: string;
  partyA: string;
  partyB: string;
}): PartyAdaptations {
  return {
    party_a: payload.partyA,
    party_b: payload.partyB,
  };
}

export async function insertAgentMessage(params: {
  roomId: string;
  canonicalContent: string;
  adaptations: PartyAdaptations;
  messageKind: MediationMessageKind;
}) {
  const [row] = await db
    .insert(roomMessages)
    .values({
      roomId: params.roomId,
      channel: "shared",
      senderType: "agent",
      content: params.canonicalContent,
      canonicalContent: params.canonicalContent,
      adaptations: params.adaptations,
      messageKind: params.messageKind,
    })
    .returning();
  return row;
}

export async function insertParticipantMessage(params: {
  roomId: string;
  userId: string;
  content: string;
}) {
  const [row] = await db
    .insert(roomMessages)
    .values({
      roomId: params.roomId,
      channel: "shared",
      senderType: "participant",
      senderUserId: params.userId,
      content: params.content,
    })
    .returning();
  return row;
}

export async function insertSystemMessage(params: {
  roomId: string;
  content: string;
  canonicalContent?: string;
  adaptations?: PartyAdaptations;
}) {
  const [row] = await db
    .insert(roomMessages)
    .values({
      roomId: params.roomId,
      channel: "shared",
      senderType: "system",
      content: params.content,
      canonicalContent: params.canonicalContent ?? null,
      adaptations: params.adaptations ?? null,
      messageKind: "mediation_system",
    })
    .returning();
  return row;
}

function viewerLocale(value: string | null | undefined): Locale {
  return value === "uk" ? "uk" : "en";
}

function shouldFallbackToCanonicalForEnglish(params: {
  adapted: string;
  canonical: string;
  preferredLocale?: string | null;
}) {
  if (params.preferredLocale !== "en") return false;

  const adapted = params.adapted.toLowerCase();
  if (!adapted.trim()) return true;

  // Guard against occasional Romance-language drift in model adaptations.
  const romanceSignals = [
    /\b(la|el|los|las|una|unos|del|que|por|para|con|sin)\b/g,
    /\b(parte|ronda|mediaci[oó]n|comunidad|cumplimiento|acuerdo)\b/g,
    /[áéíóúñçàèìòù]/g,
  ];
  const signalCount = romanceSignals.reduce(
    (count, pattern) => count + ((adapted.match(pattern) ?? []).length > 0 ? 1 : 0),
    0,
  );

  if (signalCount < 2) return false;
  return params.canonical.trim().length > 0;
}

export function resolveMessageForViewer(
  message: typeof roomMessages.$inferSelect,
  viewerRole: PartyRole,
  viewerPreferredLocale?: string | null,
) {
  if (message.adaptations && message.canonicalContent) {
    const adapted = resolveAdaptedText(
      message.adaptations as PartyAdaptations,
      message.canonicalContent,
      viewerRole,
    );
    if (
      shouldFallbackToCanonicalForEnglish({
        adapted,
        canonical: message.canonicalContent,
        preferredLocale: viewerPreferredLocale,
      })
    ) {
      return message.canonicalContent;
    }
    return adapted;
  }
  if (message.messageKind === "mediation_system" && viewerPreferredLocale) {
    return portalCopy[viewerLocale(viewerPreferredLocale)].mediationOptionsReady;
  }
  return message.content;
}
