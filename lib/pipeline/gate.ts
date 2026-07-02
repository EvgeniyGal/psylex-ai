import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getRoomSides } from "@/lib/room/helpers";

function isPersonalBotReady(user: {
  personalBotPrompt: string | null;
  personalBotReadyAt: Date | null;
}) {
  return !!user.personalBotReadyAt && !!user.personalBotPrompt?.trim();
}

export { isPersonalBotReady };

export async function getRoomSidesForPipeline(roomId: string) {
  const sides = await getRoomSides(roomId);
  const side1 = sides.find((side) => side.role === "side1") ?? null;
  const side2 = sides.find((side) => side.role === "side2") ?? null;
  return { side1, side2, sides };
}

export async function canTriggerPostIntakePipeline(roomId: string) {
  const { side1, side2 } = await getRoomSidesForPipeline(roomId);
  if (!side1 || !side2) return false;

  return (
    hasSubmittedDisputeIntake(side1) &&
    hasSubmittedDisputeIntake(side2) &&
    isPersonalBotReady(side1) &&
    isPersonalBotReady(side2)
  );
}

export function isUserPsychodynamicComplete(user: {
  psychodynamicProfileAt: Date | null;
}) {
  return !!user.psychodynamicProfileAt;
}

export function isUserEmotionalTriggersComplete(user: {
  emotionalTriggersAt: Date | null;
}) {
  return !!user.emotionalTriggersAt;
}

export function isRoomInterestsComplete(room: { interestsAnalysisAt: Date | null }) {
  return !!room.interestsAnalysisAt;
}

export function isRoomLegalAnalysisComplete(room: { legalAnalysisAt: Date | null }) {
  return !!room.legalAnalysisAt;
}

export async function isPostIntakePipelineComplete(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return false;

  const { side1, side2 } = await getRoomSidesForPipeline(roomId);
  if (!side1 || !side2) return false;

  return (
    isUserPsychodynamicComplete(side1) &&
    isUserPsychodynamicComplete(side2) &&
    isUserEmotionalTriggersComplete(side1) &&
    isUserEmotionalTriggersComplete(side2) &&
    isRoomInterestsComplete(room) &&
    isRoomLegalAnalysisComplete(room)
  );
}

export async function isPostIntakePipelineRunning(roomId: string) {
  const ready = await canTriggerPostIntakePipeline(roomId);
  if (!ready) return false;

  const complete = await isPostIntakePipelineComplete(roomId);
  return !complete;
}

export async function markPipelineStarted(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room || room.postIntakePipelineStartedAt) return;

  await db
    .update(rooms)
    .set({ postIntakePipelineStartedAt: new Date() })
    .where(eq(rooms.id, roomId));
}

export async function markPipelineCompleted(roomId: string) {
  await db
    .update(rooms)
    .set({ postIntakePipelineCompletedAt: new Date() })
    .where(eq(rooms.id, roomId));
}

export async function listUsersWithPersonalBot() {
  const rows = await db.select().from(users);
  return rows.filter((user) => isPersonalBotReady(user));
}

export async function listUsersForEmotionalTriggersTest() {
  const rows = await db.select().from(users);
  return rows.filter(
    (user) => isPersonalBotReady(user) && hasSubmittedDisputeIntake(user),
  );
}

export async function listRoomsWithBothSidesIntakeComplete() {
  const allRooms = await db.select().from(rooms);
  const eligible = [];

  for (const room of allRooms) {
    if (await canTriggerPostIntakePipeline(room.id)) {
      eligible.push(room);
    }
  }

  return eligible;
}
