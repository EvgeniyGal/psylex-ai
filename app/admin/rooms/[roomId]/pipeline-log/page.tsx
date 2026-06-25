import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PipelineLogContent } from "@/components/admin/pipeline-log-content";
import { db } from "@/lib/db";
import { pipelineEventLogs, roomPipelineStates, rooms } from "@/drizzle/schema";

export default async function PipelineLogPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) notFound();

  const [pipeline] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  const logs = await db
    .select({
      id: pipelineEventLogs.id,
      eventType: pipelineEventLogs.eventType,
      agentKey: pipelineEventLogs.agentKey,
      createdAt: pipelineEventLogs.createdAt,
    })
    .from(pipelineEventLogs)
    .where(eq(pipelineEventLogs.roomId, roomId))
    .orderBy(asc(pipelineEventLogs.createdAt));

  return (
    <PipelineLogContent
      logs={logs}
      pipelineStatus={pipeline?.status ?? null}
      roomId={roomId}
      roomTitle={room.title}
    />
  );
}
