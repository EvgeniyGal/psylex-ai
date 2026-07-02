import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { roomPipelineStates, rooms, users } from "@/drizzle/schema";
import { requireSessionUserId } from "@/lib/auth-session";
import { ensurePipelineState } from "@/lib/room/helpers";
import { RoomDetailContent } from "@/components/admin/room-detail-content";

export default async function MediatorRoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const userId = await requireSessionUserId();

  const [room] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.createdByUserId, userId)))
    .limit(1);
  if (!room) notFound();

  await ensurePipelineState(roomId);
  const [pipeline] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  const participants = await db.select().from(users).where(eq(users.roomId, roomId));

  return (
    <RoomDetailContent
      basePath="/mediator/rooms"
      participants={participants}
      pipelineStatus={pipeline?.status ?? "awaiting_situations"}
      readOnly
      room={room}
    />
  );
}
