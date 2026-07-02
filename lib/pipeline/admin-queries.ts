import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { formatDisputeIntakeAnswers } from "@/lib/pipeline/assemble-input";
import {
  canTriggerPostIntakePipeline,
  getRoomSidesForPipeline,
  listRoomsWithBothSidesIntakeComplete,
  listUsersForEmotionalTriggersTest,
  listUsersWithPersonalBot,
} from "@/lib/pipeline/gate";

export async function getEligibleTestUsers(agentKey: "psychodynamic" | "emotional_triggers") {
  const usersList =
    agentKey === "psychodynamic"
      ? await listUsersWithPersonalBot()
      : await listUsersForEmotionalTriggersTest();

  return usersList.map((user) => ({
    id: user.id,
    label: `${user.title} (${user.role})`,
    role: user.role,
  }));
}

export async function getEligibleTestRooms() {
  const roomsList = await listRoomsWithBothSidesIntakeComplete();
  return roomsList.map((room) => ({
    id: room.id,
    label: room.title,
    jurisdiction: room.jurisdiction,
  }));
}

export async function getUserTestInputPreview(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  return {
    personalBotPrompt: user.personalBotPrompt ?? "",
    disputeAnswers: formatDisputeIntakeAnswers(user, user.role),
    preferredLocale: user.preferredLocale,
  };
}

export async function getRoomTestInputPreview(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return null;

  const { side1, side2 } = await getRoomSidesForPipeline(roomId);
  if (!side1 || !side2) return null;

  return {
    jurisdiction: room.jurisdiction,
    side1Answers: formatDisputeIntakeAnswers(side1, "Side 1"),
    side2Answers: formatDisputeIntakeAnswers(side2, "Side 2"),
    side1Locale: side1.preferredLocale,
    side2Locale: side2.preferredLocale,
    bothSidesReady: await canTriggerPostIntakePipeline(roomId),
  };
}
