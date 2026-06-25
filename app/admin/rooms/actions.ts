"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { generateLogin, generatePassword } from "@/lib/generate-credentials";

function required(value: FormDataEntryValue | null, field: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
}

export async function createRoom(formData: FormData) {
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");
  const side1Title = required(formData.get("side1Title"), "side1Title");
  const side1Description = required(formData.get("side1Description"), "side1Description");
  const side2Title = required(formData.get("side2Title"), "side2Title");
  const side2Description = required(formData.get("side2Description"), "side2Description");

  const [room] = await db
    .insert(rooms)
    .values({ title, description })
    .returning();

  await db.insert(users).values([
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "side1",
      title: side1Title,
      description: side1Description,
      roomId: room.id,
    },
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "side2",
      title: side2Title,
      description: side2Description,
      roomId: room.id,
    },
  ]);

  revalidatePath("/admin/rooms");
  revalidatePath("/admin/mediators");
  redirect(`/admin/rooms/${room.id}`);
}

export async function updateRoomMeta(formData: FormData) {
  const id = String(formData.get("roomId"));
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");

  await db
    .update(rooms)
    .set({ title, description })
    .where(eq(rooms.id, id));
  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${id}`);
}

export async function updateParticipantMeta(formData: FormData) {
  const id = String(formData.get("userId"));
  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");

  await db.update(users).set({ title, description }).where(eq(users.id, id));
  const [user] = await db.select({ roomId: users.roomId }).from(users).where(eq(users.id, id)).limit(1);
  revalidatePath("/admin/rooms");
  revalidatePath("/admin/mediators");
  if (user?.roomId) revalidatePath(`/admin/rooms/${user.roomId}`);
}

export async function deleteRoom(formData: FormData) {
  const roomId = String(formData.get("roomId"));

  await db.delete(users).where(eq(users.roomId, roomId));
  await db.delete(rooms).where(eq(rooms.id, roomId));

  revalidatePath("/admin/rooms");
  revalidatePath("/admin/mediators");
  redirect("/admin/rooms");
}
