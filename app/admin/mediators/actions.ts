"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { generateLogin, generatePassword } from "@/lib/generate-credentials";

export async function createMediator(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  const title = String(formData.get("title") || "Mediator");
  const description = String(formData.get("description") || "Session mediator");

  const existing = await db
    .select()
    .from(users)
    .where(and(eq(users.sessionId, sessionId), eq(users.role, "mediator")))
    .limit(1);
  if (existing.length > 0) return;

  await db.insert(users).values({
    login: generateLogin(),
    password: generatePassword(),
    role: "mediator",
    title,
    description,
    sessionId,
  });

  revalidatePath("/admin/mediators");
  revalidatePath("/admin/sessions");
}
