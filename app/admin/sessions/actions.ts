"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, users } from "@/drizzle/schema";
import { generateLogin, generatePassword } from "@/lib/generate-credentials";

function required(value: FormDataEntryValue | null, field: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
}

export async function createSession(formData: FormData) {
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");
  const plaintiffTitle = required(formData.get("plaintiffTitle"), "plaintiffTitle");
  const plaintiffDescription = required(formData.get("plaintiffDescription"), "plaintiffDescription");
  const defendantTitle = required(formData.get("defendantTitle"), "defendantTitle");
  const defendantDescription = required(formData.get("defendantDescription"), "defendantDescription");

  const [session] = await db
    .insert(sessions)
    .values({ title, description })
    .returning();

  await db.insert(users).values([
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "plaintiff",
      title: plaintiffTitle,
      description: plaintiffDescription,
      sessionId: session.id,
    },
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "defendant",
      title: defendantTitle,
      description: defendantDescription,
      sessionId: session.id,
    },
  ]);

  revalidatePath("/admin/sessions");
  revalidatePath("/admin/mediators");
  redirect(`/admin/sessions/${session.id}`);
}

export async function updateSessionMeta(formData: FormData) {
  const id = String(formData.get("sessionId"));
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");

  await db
    .update(sessions)
    .set({ title, description })
    .where(eq(sessions.id, id));
  revalidatePath("/admin/sessions");
  revalidatePath(`/admin/sessions/${id}`);
}

export async function updateParticipantMeta(formData: FormData) {
  const id = String(formData.get("userId"));
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");

  await db.update(users).set({ title, description }).where(eq(users.id, id));
  const [user] = await db.select({ sessionId: users.sessionId }).from(users).where(eq(users.id, id)).limit(1);
  revalidatePath("/admin/sessions");
  revalidatePath("/admin/mediators");
  if (user?.sessionId) revalidatePath(`/admin/sessions/${user.sessionId}`);
}

export async function deleteSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));

  await db.delete(users).where(eq(users.sessionId, sessionId));
  await db.delete(sessions).where(eq(sessions.id, sessionId));

  revalidatePath("/admin/sessions");
  revalidatePath("/admin/mediators");
  redirect("/admin/sessions");
}
