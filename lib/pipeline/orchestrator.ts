import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomMessages, roomPipelineStates, situationDescriptions, users } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { runCompatibilityAgent } from "@/lib/pipeline/agents/compatibility";
import { formatJurisdictionQuestion, resolveSideClarificationRequests, runLegalDomainAgent } from "@/lib/pipeline/agents/legal-domain";
import {
  buildLegalDomainSideInputs,
  getLatestClarificationAnswer,
  getLatestClarificationAnswers,
} from "@/lib/pipeline/legal-domain-history";
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

const STUCK_PIPELINE_MS = 45_000;
const ORCHESTRATOR_LOCK_MS = 10 * 60_000;

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

type PrivateThreadContext = {
  agentKey: string;
  question: string;
  answer: string;
};

async function getPrivateAgentThreadContext(
  roomId: string,
  userId: string,
): Promise<PrivateThreadContext | null> {
  const rows = await db
    .select()
    .from(roomMessages)
    .where(eq(roomMessages.roomId, roomId));

  const thread = rows
    .filter((m) => m.channel === "private" && m.participantUserId === userId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const lastAgent = [...thread].reverse().find((m) => m.senderType === "agent");
  const lastParticipant = [...thread].reverse().find((m) => m.senderType === "participant");

  if (!lastAgent?.senderAgent || !lastParticipant) return null;
  if (lastParticipant.createdAt <= lastAgent.createdAt) return null;

  return {
    agentKey: lastAgent.senderAgent,
    question: lastAgent.content,
    answer: lastParticipant.content,
  };
}

async function resumeJurisdictionPipeline(roomId: string) {
  const sides = await getRoomSides(roomId);
  const ctx = await loadPipelineContext(roomId);
  const participants = await buildLegalDomainSideInputs(roomId, ctx);
  const answers = getLatestClarificationAnswers(participants);
  if (!sides.some((side) => answers[side.id]?.trim())) return;

  await db
    .update(roomPipelineStates)
    .set({
      pendingInput: null,
      currentAgent: null,
      status: "pipeline_running",
      updatedAt: new Date(),
    })
    .where(eq(roomPipelineStates.roomId, roomId));

  await runPipelineOrchestrator(roomId);
}

async function resumeSynthesisClarification(roomId: string, userId: string) {
  await ensurePipelineState(roomId);

  const [existing] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (existing?.currentAgent === "orchestrator") {
    const lockAge = Date.now() - new Date(existing.updatedAt).getTime();
    if (lockAge < ORCHESTRATOR_LOCK_MS) return;
  }

  await db
    .update(roomPipelineStates)
    .set({ currentAgent: "orchestrator", updatedAt: new Date() })
    .where(eq(roomPipelineStates.roomId, roomId));

  try {
    await resumeSynthesisClarificationInner(roomId, userId);
  } finally {
    const [state] = await db
      .select()
      .from(roomPipelineStates)
      .where(eq(roomPipelineStates.roomId, roomId))
      .limit(1);

    if (state?.currentAgent === "orchestrator") {
      await db
        .update(roomPipelineStates)
        .set({ currentAgent: null, updatedAt: new Date() })
        .where(eq(roomPipelineStates.roomId, roomId));
    }
  }
}

async function resumeSynthesisClarificationInner(roomId: string, userId: string) {
  const threadCtx = await getPrivateAgentThreadContext(roomId, userId);
  if (!threadCtx || threadCtx.agentKey !== "synthesis") return;

  const [state] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (!state) return;

  const ctx = await loadPipelineContext(roomId);
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

    await db
      .update(roomPipelineStates)
      .set({
        clarificationStatus: clarification,
        pendingInput: { type: "clarification", userId, waitingUserIds: [userId] },
        currentAgent: "synthesis",
        status: "awaiting_clarification",
        updatedAt: new Date(),
      })
      .where(eq(roomPipelineStates.roomId, roomId));
    return;
  }

  await db
    .update(roomPipelineStates)
    .set({
      clarificationStatus: clarification,
      pendingInput: null,
      currentAgent: null,
      status: "awaiting_clarification",
      updatedAt: new Date(),
    })
    .where(eq(roomPipelineStates.roomId, roomId));

  const sides = await getRoomSides(roomId);
  const allComplete = sides.every((side) => clarification[side.id]?.complete);
  if (allComplete) {
    await publishResolutionOptions(roomId, await loadPipelineContext(roomId));
    return;
  }

  const waitingUserIds = sides
    .filter((side) => !clarification[side.id]?.complete)
    .map((side) => side.id);

  if (waitingUserIds.length > 0) {
    await db
      .update(roomPipelineStates)
      .set({
        pendingInput: { type: "clarification", userId: waitingUserIds[0], waitingUserIds },
        currentAgent: "synthesis",
        status: "awaiting_clarification",
        updatedAt: new Date(),
      })
      .where(eq(roomPipelineStates.roomId, roomId));
  }

  await runAgentFourClarifications(roomId, await loadPipelineContext(roomId));
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
    if (cur.senderType === "agent" && cur.senderAgent === "synthesis" && next.senderType === "participant") {
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

  const sides = await getRoomSides(roomId);
  const participants = await buildLegalDomainSideInputs(roomId, ctx);
  const clarificationAnswers = getLatestClarificationAnswers(participants);
  const hasClarificationAnswers = Object.values(clarificationAnswers).some((answer) => answer.trim());
  const pending = parsePendingInput(state?.pendingInput);

  if (state?.status === "awaiting_clarification" && pending) {
    return;
  }

  if (state?.jurisdiction && state.legalDomain?.trim() && !hasClarificationAnswers) {
    return;
  }

  await logPipelineEvent(roomId, "agent_started", "legal_domain");
  const result = await runLegalDomainAgent(ctx, participants);
  const sideRequests = resolveSideClarificationRequests(result, sides, participants);
  const pendingRequests = sideRequests.filter(
    (request) => request.needed && request.question?.trim(),
  );

  if (result.jurisdiction?.trim() || pendingRequests.length === 0) {
    const jurisdiction =
      result.jurisdiction?.trim() ||
      Object.values(clarificationAnswers)
        .map((answer) => answer.trim())
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 2000) ||
      "unspecified";

    await db
      .update(roomPipelineStates)
      .set({
        legalDomain: result.legalDomain,
        jurisdiction,
        applicableNorms: result.applicableNorms,
        currentAgent: null,
        pendingInput: null,
        updatedAt: new Date(),
      })
      .where(eq(roomPipelineStates.roomId, roomId));

    await logPipelineEvent(roomId, "agent_completed", "legal_domain");
    ctx.legalDomain = { ...result, jurisdiction, needsJurisdictionClarification: false };
    return;
  }

  const waitingUserIds: string[] = [];
  for (const request of pendingRequests) {
    const side = sides.find((entry) => entry.id === request.userId);
    if (!side) continue;

    const locale = (side.preferredLocale as Locale) ?? "en";
    const question = await formatJurisdictionQuestion(request.question ?? "", locale);
    const inserted = await insertAgentPrivateMessage(
      roomId,
      request.userId,
      "legal_domain",
      question,
    );
    if (inserted) waitingUserIds.push(request.userId);
  }

  if (waitingUserIds.length === 0) {
    const jurisdiction =
      Object.values(clarificationAnswers)
        .map((answer) => answer.trim())
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 2000) || "unspecified";

    await db
      .update(roomPipelineStates)
      .set({
        legalDomain: result.legalDomain,
        jurisdiction,
        applicableNorms: result.applicableNorms,
        currentAgent: null,
        pendingInput: null,
        updatedAt: new Date(),
      })
      .where(eq(roomPipelineStates.roomId, roomId));

    await logPipelineEvent(roomId, "agent_completed", "legal_domain");
    ctx.legalDomain = { ...result, jurisdiction, needsJurisdictionClarification: false };
    return;
  }

  await db
    .update(roomPipelineStates)
    .set({
      status: "awaiting_clarification",
      currentAgent: "legal_domain",
      pendingInput: { type: "jurisdiction", waitingUserIds },
      updatedAt: new Date(),
    })
    .where(eq(roomPipelineStates.roomId, roomId));

  await logPipelineEvent(roomId, "agent_paused", "legal_domain", {
    reason: "jurisdiction",
    waitingUserIds,
  });
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
  const waitingClarificationUserIds: string[] = [];

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
      waitingClarificationUserIds.push(side.id);
    }
  }

  if (waitingClarificationUserIds.length > 0) {
    await db
      .update(roomPipelineStates)
      .set({
        currentAgent: "synthesis",
        pendingInput: {
          type: "clarification",
          userId: waitingClarificationUserIds[0],
          waitingUserIds: waitingClarificationUserIds,
        },
        clarificationStatus: clarification,
        updatedAt: new Date(),
      })
      .where(eq(roomPipelineStates.roomId, roomId));
  } else {
    await db
      .update(roomPipelineStates)
      .set({ clarificationStatus: clarification, updatedAt: new Date() })
      .where(eq(roomPipelineStates.roomId, roomId));
  }

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

  const [existing] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (existing?.currentAgent === "orchestrator") {
    const lockAge = Date.now() - new Date(existing.updatedAt).getTime();
    if (lockAge < ORCHESTRATOR_LOCK_MS) return;
  }

  await db
    .update(roomPipelineStates)
    .set({ currentAgent: "orchestrator", updatedAt: new Date() })
    .where(eq(roomPipelineStates.roomId, roomId));

  try {
    await runPipelineOrchestratorInner(roomId);
  } catch (error) {
    console.error("[pipeline] failed for room", roomId, error);
    await logPipelineEvent(roomId, "pipeline_failed", null, {
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    const [state] = await db
      .select()
      .from(roomPipelineStates)
      .where(eq(roomPipelineStates.roomId, roomId))
      .limit(1);

    if (state?.currentAgent === "orchestrator") {
      await db
        .update(roomPipelineStates)
        .set({ currentAgent: null, updatedAt: new Date() })
        .where(eq(roomPipelineStates.roomId, roomId));
    }
  }
}

export async function reconcilePipelineStatus(roomId: string) {
  const [state] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (!state) return;

  const pending = parsePendingInput(state.pendingInput);
  if (state.status === "pipeline_running" && pending?.type === "jurisdiction") {
    await db
      .update(roomPipelineStates)
      .set({ status: "awaiting_clarification", updatedAt: new Date() })
      .where(eq(roomPipelineStates.roomId, roomId));
  }
}

export async function maybeResumeStuckPipeline(roomId: string) {
  const [state] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, roomId))
    .limit(1);

  if (!state) return;

  const pending = parsePendingInput(state.pendingInput);

  if (state.status === "awaiting_clarification" && pending?.type === "jurisdiction") {
    const ctx = await loadPipelineContext(roomId);
    const participants = await buildLegalDomainSideInputs(roomId, ctx);
    const answers = getLatestClarificationAnswers(participants);
    if (!pending.waitingUserIds.some((id) => answers[id]?.trim())) return;

    await resumeJurisdictionPipeline(roomId);
    return;
  }

  if (state.status !== "pipeline_running") return;

  const age = Date.now() - new Date(state.updatedAt).getTime();

  if (state.currentAgent === "orchestrator") {
    if (age < ORCHESTRATOR_LOCK_MS) return;
    await db
      .update(roomPipelineStates)
      .set({ currentAgent: null, updatedAt: new Date() })
      .where(eq(roomPipelineStates.roomId, roomId));
  } else if (state.pendingInput || state.currentAgent) {
    return;
  } else if (age < STUCK_PIPELINE_MS) {
    return;
  }

  console.info("[pipeline] resuming stuck pipeline for room", roomId);
  await runPipelineOrchestrator(roomId);
}

async function runPipelineOrchestratorInner(roomId: string) {
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
  const threadCtx = await getPrivateAgentThreadContext(roomId, userId);
  if (!threadCtx) return;

  if (threadCtx.agentKey === "synthesis") {
    console.info("[pipeline] resuming synthesis clarification for user", userId, "room", roomId);
    await resumeSynthesisClarification(roomId, userId);
    return;
  }

  if (threadCtx.agentKey === "legal_domain") {
    console.info("[pipeline] resuming jurisdiction for user", userId, "room", roomId);
    await resumeJurisdictionPipeline(roomId);
  }
}
