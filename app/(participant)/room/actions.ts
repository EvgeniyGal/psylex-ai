"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { agentPrompts, roomMessages, roomPipelineStates, situationDescriptions } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { parseJsonResponse, runAgentCompletion } from "@/lib/pipeline/openai-client";
import { runPipelineOrchestrator, resumePipelineAfterPrivateReply } from "@/lib/pipeline/orchestrator";
import { regenerateResolutionOptions } from "@/lib/pipeline/regenerate-options";
import { requireParticipantSession } from "@/lib/portal-auth";
import { allSidesSubmitted, getParticipantRoom, getSideLocales, insertAgentSharedMessage } from "@/lib/room/helpers";
import { loadPipelineContextForRoom } from "@/lib/room/pipeline-context";
import { roomLocalesDiffer } from "@/lib/pipeline/resolve-message-locale";

function required(value: FormDataEntryValue | null, field: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
}

async function guardRoomAccess() {
  const { userId } = await requireParticipantSession();
  const status = await getUserOnboardingStatus(userId);
  if (!status.onboardingCompletedAt || !status.personalBotReady) {
    throw new Error("Onboarding must be completed before accessing the room.");
  }
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Room not found for participant.");
  return participant;
}

export async function submitSituation(formData: FormData) {
  const { user, roomId } = await guardRoomAccess();
  const whatHappened = required(formData.get("whatHappened"), "whatHappened");
  const whyDispute = required(formData.get("whyDispute"), "whyDispute");
  const supportingInfo = String(formData.get("supportingInfo") ?? "").trim();

  await db
    .insert(situationDescriptions)
    .values({
      roomId,
      userId: user.id,
      whatHappened,
      whyDispute,
      supportingInfo,
    })
    .onConflictDoUpdate({
      target: [situationDescriptions.roomId, situationDescriptions.userId],
      set: { whatHappened, whyDispute, supportingInfo, submittedAt: new Date() },
    });

  if (await allSidesSubmitted(roomId)) {
    await db
      .update(roomPipelineStates)
      .set({ status: "pipeline_running", updatedAt: new Date() })
      .where(eq(roomPipelineStates.roomId, roomId));

    void runPipelineOrchestrator(roomId)
      .catch(console.error)
      .finally(() => revalidatePath("/room"));
  }

  revalidatePath("/room");
}

export async function sendPrivateReply(formData: FormData) {
  const { user, roomId } = await guardRoomAccess();
  const content = required(formData.get("content"), "content");

  await db.insert(roomMessages).values({
    roomId,
    channel: "private",
    participantUserId: user.id,
    senderType: "participant",
    senderUserId: user.id,
    content,
  });

  try {
    await resumePipelineAfterPrivateReply(roomId, user.id);
  } catch (error) {
    console.error("[pipeline] resume after private reply failed", roomId, error);
  }

  revalidatePath("/room");
}

export async function sendSharedMessage(formData: FormData) {
  const { user, roomId } = await guardRoomAccess();
  const content = required(formData.get("content"), "content");
  const intent = String(formData.get("intent") ?? "message");

  await db.insert(roomMessages).values({
    roomId,
    channel: "shared",
    senderType: "participant",
    senderUserId: user.id,
    content,
    messageMetadata: intent === "reject" ? { intent: "reject" } : null,
  });

  const [pipeline] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (
    intent === "reject" &&
    pipeline &&
    (pipeline.status === "options_published" || pipeline.status === "post_resolution")
  ) {
    void regenerateResolutionOptions(roomId, content).catch(console.error);
  } else if (
    pipeline &&
    (pipeline.status === "options_published" || pipeline.status === "post_resolution")
  ) {
    void replyFollowUp(roomId, content).catch(console.error);
  }

  if (pipeline?.status === "options_published") {
    await db
      .update(roomPipelineStates)
      .set({ status: "post_resolution", updatedAt: new Date() })
      .where(eq(roomPipelineStates.roomId, roomId));
  }

  revalidatePath("/room");
}

async function replyFollowUp(roomId: string, question: string) {
  const ctx = await loadPipelineContextForRoom(roomId);
  const localeMap = await getSideLocales(roomId);
  const locales = Object.values(localeMap);
  const needBoth = roomLocalesDiffer(locales);

  const [promptRow] = await db
    .select()
    .from(agentPrompts)
    .where(eq(agentPrompts.agentKey, "synthesis"))
    .limit(1);

  const raw = await runAgentCompletion({
    systemPrompt: promptRow?.systemPrompt ?? "Answer follow-up questions about resolution options.",
    userMessage: JSON.stringify({ mode: "follow_up", question, context: ctx }),
    targetLocale: needBoth ? undefined : locales[0],
    jsonMode: needBoth,
  });

  if (needBoth) {
    const parsed = parseJsonResponse<{ en: string; uk: string }>(raw);
    await insertAgentSharedMessage(roomId, "synthesis", parsed.en, parsed);
  } else {
    await insertAgentSharedMessage(roomId, "synthesis", raw, null);
  }

  revalidatePath("/room");
}
