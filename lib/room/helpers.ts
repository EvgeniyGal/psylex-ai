import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  roomMessages,
  roomPipelineStates,
  rooms,
  SIDE_ROLES,
  situationDescriptions,
  users,
} from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { isParticipantRole } from "@/lib/participant-roles";
import type { ClarificationStatus, LocalizedContent, PendingInput } from "@/lib/pipeline/types";

export async function getRoomSides(roomId: string) {
  return db
    .select()
    .from(users)
    .where(and(eq(users.roomId, roomId), inArray(users.role, [...SIDE_ROLES])));
}

export async function ensurePipelineState(roomId: string) {
  const [existing] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(roomPipelineStates)
    .values({ roomId })
    .returning();
  return created;
}

export async function backfillPipelineStates() {
  const allRooms = await db.select({ id: rooms.id }).from(rooms);
  for (const room of allRooms) {
    await ensurePipelineState(room.id);
  }
}

export async function getSideLocales(roomId: string): Promise<Record<string, Locale>> {
  const sides = await getRoomSides(roomId);
  const map: Record<string, Locale> = {};
  for (const side of sides) {
    map[side.id] = (side.preferredLocale as Locale) ?? "en";
  }
  return map;
}

export async function allSidesSubmitted(roomId: string) {
  const sides = await getRoomSides(roomId);
  const submissions = await db
    .select({ userId: situationDescriptions.userId })
    .from(situationDescriptions)
    .where(eq(situationDescriptions.roomId, roomId));
  const submitted = new Set(submissions.map((s) => s.userId));
  return sides.length > 0 && sides.every((s) => submitted.has(s.id));
}

export async function insertAgentPrivateMessage(
  roomId: string,
  participantUserId: string,
  agentKey: string,
  content: string,
) {
  await db.insert(roomMessages).values({
    roomId,
    channel: "private",
    participantUserId,
    senderType: "agent",
    senderAgent: agentKey,
    content,
  });
}

export async function insertAgentSharedMessage(
  roomId: string,
  agentKey: string,
  content: string,
  contentByLocale: LocalizedContent | null,
  metadata?: Record<string, unknown>,
) {
  await db.insert(roomMessages).values({
    roomId,
    channel: "shared",
    senderType: "agent",
    senderAgent: agentKey,
    content,
    contentByLocale: contentByLocale ?? null,
    messageMetadata: metadata ?? null,
  });
}

export function parseClarificationStatus(raw: unknown): ClarificationStatus {
  if (!raw || typeof raw !== "object") return {};
  return raw as ClarificationStatus;
}

export function parsePendingInput(raw: unknown): PendingInput | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as PendingInput;
}

export async function getParticipantRoom(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.roomId || !isParticipantRole(user.role)) return null;
  return { user, roomId: user.roomId };
}
