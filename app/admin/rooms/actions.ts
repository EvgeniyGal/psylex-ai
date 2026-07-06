"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { generateLogin, generatePassword } from "@/lib/generate-credentials";
import { isRoomJurisdiction } from "@/lib/room/jurisdiction";

function required(value: FormDataEntryValue | null, field: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
}

async function assertCanManageRooms() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "admin" && role !== "mediator")) {
    throw new Error("Unauthorized");
  }
  const userId = await requireSessionUserId();
  return { role, userId };
}

export async function createRoom(formData: FormData) {
  const { role, userId } = await assertCanManageRooms();

  const title = required(formData.get("title"), "title");
  const description = required(formData.get("description"), "description");
  const partyATitle = required(formData.get("partyATitle"), "partyATitle");
  const partyADescription = required(formData.get("partyADescription"), "partyADescription");
  const partyBTitle = required(formData.get("partyBTitle"), "partyBTitle");
  const partyBDescription = required(formData.get("partyBDescription"), "partyBDescription");
  const jurisdictionRaw = required(formData.get("jurisdiction"), "jurisdiction");
  if (!isRoomJurisdiction(jurisdictionRaw)) {
    throw new Error("Invalid jurisdiction");
  }

  const [room] = await db
    .insert(rooms)
    .values({
      title,
      description,
      jurisdiction: jurisdictionRaw,
      createdByUserId: role === "mediator" ? userId : null,
    })
    .returning();

  await db.insert(users).values([
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "party_a",
      title: partyATitle,
      description: partyADescription,
      roomId: room.id,
    },
    {
      login: generateLogin(),
      password: generatePassword(),
      role: "party_b",
      title: partyBTitle,
      description: partyBDescription,
      roomId: room.id,
    },
  ]);

  revalidatePath("/admin/rooms");
  revalidatePath("/mediator/rooms");
  revalidatePath("/admin/mediators");
  redirect(role === "mediator" ? `/mediator/rooms/${room.id}` : `/admin/rooms/${room.id}`);
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
