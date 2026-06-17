"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { generateLogin, generatePassword } from "@/lib/generate-credentials";

function required(value: FormDataEntryValue | null, field: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
}

export async function createMediator(formData: FormData) {
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");

  const [mediator] = await db
    .insert(users)
    .values({
      login: generateLogin(),
      password: generatePassword(),
      role: "mediator",
      title,
      description,
      sessionId: null,
    })
    .returning();

  revalidatePath("/admin/mediators");
  revalidatePath("/admin/sessions");
  redirect(`/admin/mediators/${mediator.id}`);
}

export async function updateMediatorMeta(formData: FormData) {
  const id = String(formData.get("mediatorId"));
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");

  await db
    .update(users)
    .set({ title, description })
    .where(and(eq(users.id, id), eq(users.role, "mediator")));

  revalidatePath("/admin/mediators");
  revalidatePath(`/admin/mediators/${id}`);
  revalidatePath("/admin/sessions");
}

export async function deleteMediator(formData: FormData) {
  const mediatorId = String(formData.get("mediatorId"));

  await db.delete(users).where(and(eq(users.id, mediatorId), eq(users.role, "mediator")));

  revalidatePath("/admin/mediators");
  revalidatePath("/admin/sessions");
  redirect("/admin/mediators");
}
