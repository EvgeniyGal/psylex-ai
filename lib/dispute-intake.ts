import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, userTestCompletions, users, type users as usersTable } from "@/drizzle/schema";
import { TEST_KEYS } from "@/lib/test-keys";
import { getRoomSides } from "@/lib/room/helpers";
import type { ParticipantRole } from "@/lib/participant-roles";
import {
  canTriggerPostIntakePipeline,
  isPostIntakePipelineComplete,
} from "@/lib/pipeline/gate";

export type SideReadiness = {
  userId: string;
  role: "side1" | "side2";
  title: string;
  testsComplete: boolean;
  personalBotReady: boolean;
  disputeIntakeComplete: boolean;
  mediationReady: boolean;
};

type UserRow = typeof usersTable.$inferSelect;

export function hasSubmittedDisputeIntake(user: Pick<UserRow, "disputeIntakeSubmittedAt">) {
  return !!user.disputeIntakeSubmittedAt;
}

export function getOppositeSideRole(role: ParticipantRole): "side1" | "side2" | null {
  if (role === "side1") return "side2";
  if (role === "side2") return "side1";
  return null;
}

async function getCompletedTestCount(userId: string) {
  const rows = await db
    .select({ testKey: userTestCompletions.testKey })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  const completed = new Set(
    rows.map((row) => row.testKey).filter((key) => TEST_KEYS.includes(key as (typeof TEST_KEYS)[number])),
  );
  return completed.size;
}

export async function getSideReadiness(user: UserRow): Promise<SideReadiness | null> {
  if (user.role !== "side1" && user.role !== "side2") return null;

  const completedCount = await getCompletedTestCount(user.id);
  const testsComplete = completedCount === TEST_KEYS.length;
  const personalBotReady = !!user.personalBotReadyAt && !!user.personalBotPrompt?.trim();
  const disputeIntakeComplete = hasSubmittedDisputeIntake(user);

  return {
    userId: user.id,
    role: user.role,
    title: user.title,
    testsComplete,
    personalBotReady,
    disputeIntakeComplete,
    mediationReady: testsComplete && personalBotReady && disputeIntakeComplete,
  };
}

export async function getMediationLobbyData(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.roomId || (user.role !== "side1" && user.role !== "side2")) {
    return null;
  }

  const selfReadiness = await getSideReadiness(user);
  if (!selfReadiness) return null;

  const oppositeRole = getOppositeSideRole(user.role);
  if (!oppositeRole) return null;

  const sides = await getRoomSides(user.roomId);
  const oppositeUser = sides.find((side) => side.role === oppositeRole) ?? null;
  const oppositeReadiness = oppositeUser ? await getSideReadiness(oppositeUser) : null;

  const [room] = await db.select().from(rooms).where(eq(rooms.id, user.roomId)).limit(1);
  if (!room) return null;

  const bothReady = selfReadiness.mediationReady && !!oppositeReadiness?.mediationReady;
  const pipelineComplete = await isPostIntakePipelineComplete(room.id);
  const pipelineRunning = bothReady && !pipelineComplete && (await canTriggerPostIntakePipeline(room.id));
  const canStartMediation = bothReady && pipelineComplete;

  return {
    room,
    self: selfReadiness,
    opposite: oppositeReadiness,
    oppositeRole,
    bothReady,
    pipelineComplete,
    pipelineRunning,
    canStartMediation,
  };
}
