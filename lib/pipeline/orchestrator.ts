import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomMessages, roomPipelineStates, situationDescriptions, users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { runCompatibilityAgent } from "@/lib/pipeline/agents/compatibility";
import { formatJurisdictionQuestion, runLegalDomainAgent } from "@/lib/pipeline/agents/legal-domain";
import { runPrecedentsAgent } from "@/lib/pipeline/agents/precedents";
import { runSynthesisClarification, runSynthesisOptions } from "@/lib/pipeline/agents/synthesis";
import { logPipelineEvent } from "@/lib/pipeline/event-log";
import { buildProfilesForUsers } from "@/lib/pipeline/psychological-profile";
import {
  OPTIONS_MESSAGE_KIND,
  type ClarificationStatus,
  type PipelineContext,
  type SituationInput,
} from "@/lib/pipeline/types";
import {
  ensurePipelineState,
  getRoomSides,
  getSideLocales,
  insertAgentPrivateMessage,
  insertAgentSharedMessage,
  parseClarificationStatus,
  parsePendingInput,
} from "@/lib/room/helpers";

async function loadPipelineContext(roomId: string): Promise<PipelineContext> {
  const sides = await getRoomSides(roomId);
  const situations = await db
    .select()
    .from(situationDescriptions)
    .where(eq(situationDescriptions.roomId, roomId));

  const situationInputs: SituationInput[] = situations.map((s) => {
    const side = sides.find((u) => u.id === s.userId);
    return {
      userId: s.userId,
      role: side?.role ?? "side1",
      whatHappened: s.whatHappened,
      whyDispute: s.whyDispute,
      supportingInfo: s.supportingInfo,
    };
  });

  const profiles = await buildProfilesForUsers(sides.map((s) => s.id));
  const locales = await getSideLocales(roomId);

  const [state] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  return {
    roomId,
    situations: situationInputs,
    profiles,
    locales,
    legalDomain: state?.legalDomain
      ? {
          legalDomain: state.legalDomain,
          jurisdiction: state.jurisdiction,
          applicableNorms: state.applicableNorms ?? "",
          needsJurisdictionClarification: false,
          jurisdictionQuestion: null,
        }
      : null,
    precedents: state?.caseLawResults as PipelineContext["precedents"],
    compatibility: state?.compatibilityAnalysis as PipelineContext["compatibility"],
  };
}

async function getJurisdictionAnswers(roomId: string, userIds: string[]) {
  const answers: Record<string, string> = {};
  for (const userId of userIds) {
    const rows = await db
      .select()
      .from(roomMessages)
      .where(eq(roomMessages.roomId, roomId));
    const privateReplies = rows
      .filter(
        (m) =>
          m.channel === "private" &&
          m.participantUserId === userId &&
          m.senderType === "participant",
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const last = privateReplies.at(-1);
    if (last) answers[userId] = last.content;
  }
  return answers;
}

async function getClarificationReplies(roomId: string, userId: string) {
  const rows = await db
    .select()
    .from(roomMessages)
    .where(eq(roomMessages.roomId, roomId));

  const thread = rows
    .filter(
      (m) =>
        m.channel === "private" &&
        m.participantUserId === userId &&
        (m.senderType === "agent" || m.senderType === "participant"),
    )
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const pairs: { question: string; answer: string }[] = [];
  for (let i = 0; i < thread.length - 1; i++) {
    const cur = thread[i];
    const next = thread[i + 1];
    if (cur.senderType === "agent" && next.senderType === "participant") {
      pairs.push({ question: cur.content, answer: next.content });
    }
  }
  return pairs;
}

async function runAgentOne(roomId: string, ctx: PipelineContext) {
  const [state] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  const pending = parsePendingInput(state?.pendingInput);
  const sides = await getRoomSides(roomId);

  if (state?.jurisdiction && state.legalDomain) {
    return;
  }

  const jurisdictionAnswers =
    pending?.type === "jurisdiction"
      ? await getJurisdictionAnswers(roomId, pending.waitingUserIds)
      : {};

  await logPipelineEvent(roomId, "agent_started", "legal_domain");
  const result = await runLegalDomainAgent(ctx, jurisdictionAnswers);

  if (result.needsJurisdictionClarification && !result.jurisdiction) {
    const waitingUserIds = sides.map((s) => s.id);
    for (const side of sides) {
      const locale = (side.preferredLocale as Locale) ?? "en";
      const question = await formatJurisdictionQuestion(
        result.jurisdictionQuestion ?? "",
        locale,
      );
      await insertAgentPrivateMessage(roomId, side.id, "legal_domain", question);
    }

    await db
      .update(roomPipelineStates)
      .set({
        currentAgent: "legal_domain",
        pendingInput: { type: "jurisdiction", waitingUserIds },
        updatedAt: new Date(),
      })
      .where(eq(roomPipelineStates.roomId, roomId));

    await logPipelineEvent(roomId, "agent_paused", "legal_domain", {
      reason: "jurisdiction",
    });
    return;
  }

  await db
    .update(roomPipelineStates)
    .set({
      legalDomain: result.legalDomain,
      jurisdiction: result.jurisdiction ?? "unspecified",
      applicableNorms: result.applicableNorms,
      currentAgent: null,
      pendingInput: null,
      updatedAt: new Date(),
    })
    .where(eq(roomPipelineStates.roomId, roomId));

  await logPipelineEvent(roomId, "agent_completed", "legal_domain");
  ctx.legalDomain = result;
}

async function runAgentsTwoAndThree(roomId: string, ctx: PipelineContext) {
  const [state] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (state?.caseLawResults && state.compatibilityAnalysis) {
    ctx.precedents = state.caseLawResults as PipelineContext["precedents"];
    ctx.compatibility = state.compatibilityAnalysis as PipelineContext["compatibility"];
    return;
  }

  await logPipelineEvent(roomId, "agent_started", "precedents");
  await logPipelineEvent(roomId, "agent_started", "compatibility");

  const [precedents, compatibility] = await Promise.all([
    runPrecedentsAgent(ctx),
    runCompatibilityAgent(ctx),
  ]);

  await db
    .update(roomPipelineStates)
    .set({
      caseLawResults: precedents,
      compatibilityAnalysis: compatibility,
      updatedAt: new Date(),
    })
    .where(eq(roomPipelineStates.roomId, roomId));

  ctx.precedents = precedents;
  ctx.compatibility = compatibility;

  await logPipelineEvent(roomId, "agent_completed", "precedents");
  await logPipelineEvent(roomId, "agent_completed", "compatibility");
}

async function runAgentFourClarifications(roomId: string, ctx: PipelineContext) {
  const [state] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  const clarification = parseClarificationStatus(state?.clarificationStatus);
  const sides = await getRoomSides(roomId);
  let anyPending = false;

  await db
    .update(roomPipelineStates)
    .set({ status: "awaiting_clarification", updatedAt: new Date() })
    .where(eq(roomPipelineStates.roomId, roomId));

  for (const side of sides) {
    const status = clarification[side.id] ?? { complete: false, round: 0 };
    if (status.complete) continue;

    const priorReplies = await getClarificationReplies(roomId, side.id);
    const result = await runSynthesisClarification(ctx, side.id, priorReplies);

    if (result.sideComplete || !result.needsClarification) {
      clarification[side.id] = { complete: true, round: status.round + 1 };
      continue;
    }

    if (result.question) {
      const locale = (side.preferredLocale as Locale) ?? "en";
      await insertAgentPrivateMessage(roomId, side.id, "synthesis", result.question);
      clarification[side.id] = { complete: false, round: status.round + 1 };
      anyPending = true;

      await db
        .update(roomPipelineStates)
        .set({
          currentAgent: "synthesis",
          pendingInput: { type: "clarification", userId: side.id },
          clarificationStatus: clarification,
          updatedAt: new Date(),
        })
        .where(eq(roomPipelineStates.roomId, roomId));
    }
  }

  await db
    .update(roomPipelineStates)
    .set({ clarificationStatus: clarification, updatedAt: new Date() })
    .where(eq(roomPipelineStates.roomId, roomId));

  const allComplete = sides.every((s) => clarification[s.id]?.complete);
  if (allComplete) {
    await publishResolutionOptions(roomId, ctx);
    return;
  }

  if (anyPending) {
    await logPipelineEvent(roomId, "agent_paused", "synthesis", { reason: "clarification" });
  }
}

async function publishResolutionOptions(roomId: string, ctx: PipelineContext) {
  const sides = await getRoomSides(roomId);
  const locales = sides.map((s) => (s.preferredLocale as Locale) ?? "en");
  const version =
    (
      await db
        .select()
        .from(roomMessages)
        .where(eq(roomMessages.roomId, roomId))
    ).filter((m) => m.messageMetadata && (m.messageMetadata as { kind?: string }).kind === OPTIONS_MESSAGE_KIND)
      .length + 1;

  await logPipelineEvent(roomId, "agent_started", "synthesis", { mode: "options" });
  const { options, content, localized } = await runSynthesisOptions(ctx, locales);

  await insertAgentSharedMessage(roomId, "synthesis", content, localized, {
    kind: OPTIONS_MESSAGE_KIND,
    options,
    optionsVersion: version,
  });

  await db
    .update(roomPipelineStates)
    .set({
      status: "options_published",
      currentAgent: null,
      pendingInput: null,
      updatedAt: new Date(),
    })
    .where(eq(roomPipelineStates.roomId, roomId));

  await logPipelineEvent(roomId, "options_published", "synthesis", { version });
}

export async function runPipelineOrchestrator(roomId: string) {
  await ensurePipelineState(roomId);
  const [state] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (!state || state.status === "awaiting_situations") {
    return;
  }

  const ctx = await loadPipelineContext(roomId);

  if (state.status === "options_published" || state.status === "post_resolution") {
    return;
  }

  await db
    .update(roomPipelineStates)
    .set({ status: "pipeline_running", updatedAt: new Date() })
    .where(eq(roomPipelineStates.roomId, roomId));

  await runAgentOne(roomId, ctx);

  const [afterOne] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (afterOne?.pendingInput) return;

  const refreshed = await loadPipelineContext(roomId);
  await runAgentsTwoAndThree(roomId, refreshed);
  const finalCtx = await loadPipelineContext(roomId);
  await runAgentFourClarifications(roomId, finalCtx);
}

export async function resumePipelineAfterPrivateReply(roomId: string, userId: string) {
  const [state] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (!state) return;

  const pending = parsePendingInput(state.pendingInput);
  const ctx = await loadPipelineContext(roomId);

  if (pending?.type === "jurisdiction" && state.currentAgent === "legal_domain") {
    const answers = await getJurisdictionAnswers(roomId, pending.waitingUserIds);
    const allAnswered = pending.waitingUserIds.every((id) => answers[id]?.trim());
    if (!allAnswered) return;

    await db
      .update(roomPipelineStates)
      .set({ pendingInput: null, currentAgent: null, updatedAt: new Date() })
      .where(eq(roomPipelineStates.roomId, roomId));

    await runPipelineOrchestrator(roomId);
    return;
  }

  if (pending?.type === "clarification" && pending.userId === userId) {
    const clarification = parseClarificationStatus(state.clarificationStatus);
    const priorReplies = await getClarificationReplies(roomId, userId);
    const result = await runSynthesisClarification(ctx, userId, priorReplies);

    if (result.sideComplete || !result.needsClarification) {
      clarification[userId] = { complete: true, round: (clarification[userId]?.round ?? 0) + 1 };
    } else if (result.question) {
      const [side] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const locale = (side?.preferredLocale as Locale) ?? "en";
      await insertAgentPrivateMessage(roomId, userId, "synthesis", result.question);
      clarification[userId] = { complete: false, round: (clarification[userId]?.round ?? 0) + 1 };
    }

    await db
      .update(roomPipelineStates)
      .set({
        clarificationStatus: clarification,
        pendingInput: null,
        currentAgent: null,
        updatedAt: new Date(),
      })
      .where(eq(roomPipelineStates.roomId, roomId));

    const sides = await getRoomSides(roomId);
    const allComplete = sides.every((s) => clarification[s.id]?.complete);
    if (allComplete) {
      await publishResolutionOptions(roomId, await loadPipelineContext(roomId));
      return;
    }

    await runAgentFourClarifications(roomId, await loadPipelineContext(roomId));
  }
}
