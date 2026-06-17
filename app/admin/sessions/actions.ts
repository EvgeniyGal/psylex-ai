"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sessions, users } from "@/drizzle/schema";
import { generateLogin, generatePassword } from "@/lib/generate-credentials";

export async function createSession() {
  const [session] = await db
    .insert(sessions)
    .values({
      title: `Session ${new Date().toISOString().slice(0, 10)}`,
      description: "Initial mediation session",
    })
    .returning();

  await db.insert(users).values([
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "plaintiff",
      title: "Plaintiff",
      description: "Primary claimant",
      sessionId: session.id,
    },
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "defendant",
      title: "Defendant",
      description: "Responding party",
      sessionId: session.id,
    },
  ]);

  revalidatePath("/admin/sessions");
  revalidatePath("/admin/mediators");
}

export async function updateSessionMeta(formData: FormData) {
  const id = String(formData.get("sessionId"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));

  await db
    .update(sessions)
    .set({ title, description })
    .where(eq(sessions.id, id));
  revalidatePath("/admin/sessions");
}

export async function updateParticipantMeta(formData: FormData) {
  const id = String(formData.get("userId"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));

  await db.update(users).set({ title, description }).where(eq(users.id, id));
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/mediators");
}
