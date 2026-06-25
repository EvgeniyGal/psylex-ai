import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { RoomDetailContent } from "@/components/admin/room-detail-content";

export default async function AdminRoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) notFound();

  const participants = await db.select().from(users).where(eq(users.roomId, roomId));

  return <RoomDetailContent participants={participants} room={room} />;
}
