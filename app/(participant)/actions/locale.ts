"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { isParticipantRole } from "@/lib/participant-roles";

export async function syncParticipantLocale(locale: Locale) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isParticipantRole(session.user.role ?? "")) return;

  await db
    .update(users)
    .set({ preferredLocale: locale })
    .where(eq(users.id, session.user.id));

  revalidatePath("/room");
  revalidatePath("/dashboard");
}
