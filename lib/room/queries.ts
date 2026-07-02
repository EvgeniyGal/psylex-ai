import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";

export async function getRoomPageData(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.roomId) return null;

  const [room] = await db.select().from(rooms).where(eq(rooms.id, user.roomId)).limit(1);
  if (!room) return null;

  const viewerLocale = (user.preferredLocale as Locale) ?? "en";

  return {
    room,
    user,
    viewerLocale,
  };
}
