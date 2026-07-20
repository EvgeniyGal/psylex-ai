import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, userTestCompletions, users } from "@/drizzle/schema";
import { TEST_KEYS } from "@/lib/test-keys";
import {
  isRoomInterestsComplete,
  isRoomLegalAnalysisComplete,
  isUserEmotionalTriggersComplete,
  isUserPsychodynamicComplete,
  isPersonalBotReady,
} from "@/lib/pipeline/gate";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";

function partyHasAllTests(userId: string, completionsByUser: Map<string, Set<string>>) {
  const keys = completionsByUser.get(userId) ?? new Set();
  return TEST_KEYS.every((key) => keys.has(key));
}

function isPartyMediationReady(
  user: typeof users.$inferSelect,
  completionsByUser: Map<string, Set<string>>,
) {
  return (
    partyHasAllTests(user.id, completionsByUser) &&
    isPersonalBotReady(user) &&
    hasSubmittedDisputeIntake(user)
  );
}

/** Both parties ready (tests + bot + intake) and post-intake pipeline complete. */
export async function getRoomsPreparationReadyMap(
  roomIds: string[],
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  if (roomIds.length === 0) return result;

  const [roomRows, partyRows] = await Promise.all([
    db.select().from(rooms).where(inArray(rooms.id, roomIds)),
    db.select().from(users).where(inArray(users.roomId, roomIds)),
  ]);

  const partyIds = partyRows
    .filter((user) => user.role === "party_a" || user.role === "party_b")
    .map((user) => user.id);

  const completionRows =
    partyIds.length > 0
      ? await db
          .select({
            userId: userTestCompletions.userId,
            testKey: userTestCompletions.testKey,
          })
          .from(userTestCompletions)
          .where(inArray(userTestCompletions.userId, partyIds))
      : [];

  const completionsByUser = new Map<string, Set<string>>();
  for (const row of completionRows) {
    const set = completionsByUser.get(row.userId) ?? new Set<string>();
    set.add(row.testKey);
    completionsByUser.set(row.userId, set);
  }

  const partiesByRoom = new Map<string, typeof partyRows>();
  for (const user of partyRows) {
    if (!user.roomId || (user.role !== "party_a" && user.role !== "party_b")) continue;
    const list = partiesByRoom.get(user.roomId) ?? [];
    list.push(user);
    partiesByRoom.set(user.roomId, list);
  }

  for (const room of roomRows) {
    const parties = partiesByRoom.get(room.id) ?? [];
    const partyA = parties.find((p) => p.role === "party_a");
    const partyB = parties.find((p) => p.role === "party_b");
    if (!partyA || !partyB) {
      result.set(room.id, false);
      continue;
    }

    const bothPartiesReady =
      isPartyMediationReady(partyA, completionsByUser) &&
      isPartyMediationReady(partyB, completionsByUser);

    const pipelineComplete =
      isUserPsychodynamicComplete(partyA) &&
      isUserPsychodynamicComplete(partyB) &&
      isUserEmotionalTriggersComplete(partyA) &&
      isUserEmotionalTriggersComplete(partyB) &&
      isRoomInterestsComplete(room) &&
      isRoomLegalAnalysisComplete(room);

    result.set(room.id, bothPartiesReady && pipelineComplete);
  }

  return result;
}
