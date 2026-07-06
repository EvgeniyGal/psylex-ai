"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import {
  acceptAgreement,
  castCompromiseVote,
  castVote,
  getMediationRoomState,
  markReadyForOptions,
  submitDialogueReply,
} from "@/lib/mediation/orchestrator";
import { buildAgreementDownload } from "@/lib/mediation/pdf";

async function requireParticipant() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function fetchMediationRoomState() {
  const userId = await requireParticipant();
  return getMediationRoomState(userId);
}

export async function sendDialogueReply(content: string) {
  const userId = await requireParticipant();
  return submitDialogueReply(userId, content);
}

export async function clickReadyForOptions() {
  const userId = await requireParticipant();
  await markReadyForOptions(userId);
  return getMediationRoomState(userId);
}

export async function submitVote(optionId: string) {
  const userId = await requireParticipant();
  await castVote(userId, optionId);
  return getMediationRoomState(userId);
}

export async function submitCompromiseVote(accepted: boolean) {
  const userId = await requireParticipant();
  await castCompromiseVote(userId, accepted);
  return getMediationRoomState(userId);
}

export async function submitAgreementAcceptance() {
  const userId = await requireParticipant();
  await acceptAgreement(userId);
  return getMediationRoomState(userId);
}

export async function downloadMediationResults() {
  const userId = await requireParticipant();
  const [user] = await db
    .select({ preferredLocale: users.preferredLocale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const state = await getMediationRoomState(userId);
  if (!state) throw new Error("Room not found.");

  const locale = (user?.preferredLocale ?? "en") as Locale;
  return buildAgreementDownload(state, locale);
}
