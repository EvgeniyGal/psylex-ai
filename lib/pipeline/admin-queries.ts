import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import { partyRoleLabel } from "@/lib/party-labels";
import { isPartyRole } from "@/lib/participant-roles";
import { formatDisputeIntakeAnswers } from "@/lib/pipeline/assemble-input";
import {
  canTriggerPostIntakePipeline,
  getRoomPartiesForPipeline,
  listEligibleMediationTestRooms,
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
    label: `${user.title} (${isPartyRole(user.role) ? partyRoleLabel(user.role) : user.role})`,
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

export async function getMediationTestRooms() {
  const roomsList = await listEligibleMediationTestRooms();
  return roomsList.map((room) => ({
    id: room.id,
    label: room.title,
    jurisdiction: room.jurisdiction,
  }));
}

export async function getUserTestInputPreview(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const roleLabel = isPartyRole(user.role)
    ? partyRoleLabel(user.role, user.preferredLocale)
    : user.role;

  return {
    personalBotPrompt: user.personalBotPrompt ?? "",
    disputeAnswers: formatDisputeIntakeAnswers(user, roleLabel),
    preferredLocale: user.preferredLocale,
  };
}

export async function getRoomTestInputPreview(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return null;

  const { partyA, partyB } = await getRoomPartiesForPipeline(roomId);
  if (!partyA || !partyB) return null;

  return {
    jurisdiction: room.jurisdiction,
    partyAAnswers: formatDisputeIntakeAnswers(partyA, partyRoleLabel("party_a", partyA.preferredLocale)),
    partyBAnswers: formatDisputeIntakeAnswers(partyB, partyRoleLabel("party_b", partyB.preferredLocale)),
    partyALocale: partyA.preferredLocale,
    partyBLocale: partyB.preferredLocale,
    bothSidesReady: await canTriggerPostIntakePipeline(roomId),
  };
}
