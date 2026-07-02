import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { requireSessionUserId } from "@/lib/auth-session";
import { RoomsContent } from "@/components/admin/rooms-content";

export default async function MediatorRoomsPage() {
  const userId = await requireSessionUserId();

  const roomRows = await db
    .select()
    .from(rooms)
    .where(eq(rooms.createdByUserId, userId))
    .orderBy(desc(rooms.createdAt));

  const participantsByRoom = await Promise.all(
    roomRows.map(async (room) => ({
      roomId: room.id,
      users: await db.select().from(users).where(eq(users.roomId, room.id)),
    })),
  );

  return (
    <RoomsContent
      basePath="/mediator/rooms"
      participantsByRoom={participantsByRoom}
      roomRows={roomRows}
      showCreateButton={true}
      showCredentialCopy={false}
      showInsights={false}
    />
  );
}
