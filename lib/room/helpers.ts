import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { PARTY_ROLES, users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { isParticipantRole } from "@/lib/participant-roles";

export async function getRoomSides(roomId: string) {
  return db
    .select()
    .from(users)
    .where(and(eq(users.roomId, roomId), inArray(users.role, [...PARTY_ROLES])));
}

export async function getSideLocales(roomId: string): Promise<Record<string, Locale>> {
  const sides = await getRoomSides(roomId);
  const map: Record<string, Locale> = {};
  for (const side of sides) {
    map[side.id] = (side.preferredLocale as Locale) ?? "en";
  }
  return map;
}

export async function getParticipantRoom(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.roomId || !isParticipantRole(user.role)) return null;
  return { user, roomId: user.roomId };
}
