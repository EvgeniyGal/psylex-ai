import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { RoomsContent } from "@/components/admin/rooms-content";

export default async function AdminRoomsPage() {
  const roomRows = await db.select().from(rooms).orderBy(desc(rooms.createdAt));

  const mediatorIds = [
    ...new Set(roomRows.map((room) => room.createdByUserId).filter((id): id is string => !!id)),
  ];

  const mediators =
    mediatorIds.length > 0
      ? await db
          .select({ id: users.id, title: users.title })
          .from(users)
          .where(inArray(users.id, mediatorIds))
      : [];

  const mediatorTitleById = new Map(mediators.map((mediator) => [mediator.id, mediator.title]));

  const roomsWithMediator = roomRows.map((room) => ({
    ...room,
    mediatorTitle: room.createdByUserId
      ? (mediatorTitleById.get(room.createdByUserId) ?? null)
      : null,
  }));

  const participantsByRoom = await Promise.all(
    roomRows.map(async (room) => ({
      roomId: room.id,
      users: await db.select().from(users).where(eq(users.roomId, room.id)),
    })),
  );

  return (
    <RoomsContent
      participantsByRoom={participantsByRoom}
      roomRows={roomsWithMediator}
      showRoomTabs
    />
  );
}
