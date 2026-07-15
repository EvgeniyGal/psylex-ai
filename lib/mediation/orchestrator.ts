import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mediationFilingReceipts, rooms } from "@/drizzle/schema";
import {
  assembleMediationContext,
  isAttackHeuristic,
  partyRoleFromUser,
} from "@/lib/mediation/assemble-input";
import {
  insertAgentMessage,
  insertParticipantMessage,
  insertSystemMessage,
  isMessageVisibleToViewer,
  listRoomMessages,
  resolveMessageForViewer,
  toPartyAdaptations,
} from "@/lib/mediation/messages";
import { runMediationAgent } from "@/lib/mediation/run-agent";
import type { Locale } from "@/lib/i18n";
import { buildMediationResultsSummary } from "@/lib/mediation/results-summary";
import { portalCopy } from "@/lib/portal-i18n";
import {
  mediationAgreementDraftSchema,
  mediationCompromiseSchema,
  mediationDataSufficiencySchema,
  mediationDialogueQuestionSchema,
  mediationModerationSchema,
  mediationOpeningSchema,
  mediationOptionsSchema,
  mediationRoundSummarySchema,
} from "@/lib/mediation/schemas";
import {
  MAX_DIALOGUE_ROUNDS,
  REPLY_TIMEOUT_MS,
  type MediationOption,
  type MediationPhase,
} from "@/lib/mediation/types";
import { isMediationOpeningPrepared } from "@/lib/mediation/prepare-opening";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { getRoomPartiesForPipeline, isPostIntakePipelineComplete } from "@/lib/pipeline/gate";
import type { PartyRole } from "@/lib/participant-roles";

type RoomRow = typeof rooms.$inferSelect;

const mediationAgentWork = new Set<string>();

function sessionEndsAt(room: RoomRow) {
  if (!room.mediationStartedAt) return null;
  return room.mediationStartedAt.getTime() + room.mediationDurationMinutes * 60_000;
}

function isSessionExpired(room: RoomRow, now = Date.now()) {
  const ends = sessionEndsAt(room);
  return ends !== null && now >= ends;
}

function bothReady(room: RoomRow) {
  return !!room.partyAReadyForOptionsAt && !!room.partyBReadyForOptionsAt;
}

function isNegotiationPhase(phase: MediationPhase | null) {
  return phase === "opening" || phase === "dialogue";
}

async function transitionIfBothReady(roomId: string, room: RoomRow) {
  if (!bothReady(room) || !isNegotiationPhase(room.mediationPhase)) return false;
  await transitionToGeneratingOptions(roomId, "both_ready");
  return true;
}

async function loadRoom(roomId: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  return room ?? null;
}

async function setPhase(roomId: string, phase: MediationPhase, payload?: Record<string, unknown>) {
  await db.update(rooms).set({ mediationPhase: phase }).where(eq(rooms.id, roomId));
  await logPipelineEvent({
    roomId,
    agentKey: "mediation",
    eventType: "mediation_phase_changed",
    payload: { phase, ...payload },
  });
}

async function buildContext(room: RoomRow) {
  const { partyA, partyB } = await getRoomPartiesForPipeline(room.id);
  if (!partyA || !partyB) throw new Error("Room parties missing.");

  const messages = await listRoomMessages(room.id);
  const ctx = assembleMediationContext({
    room,
    partyA,
    partyB,
    messages: messages.map((m) => ({
      content: m.canonicalContent ?? m.content,
      senderType: m.senderType,
      messageKind: m.messageKind,
      createdAt: m.createdAt,
    })),
  });

  return { partyA, partyB, ctx };
}

async function beginTurn(roomId: string, party: PartyRole) {
  const deadline = new Date(Date.now() + REPLY_TIMEOUT_MS);
  await db
    .update(rooms)
    .set({
      mediationActiveParty: party,
      mediationTurnDeadlineAt: deadline,
      mediationTurnNudged: false,
    })
    .where(eq(rooms.id, roomId));
}

async function clearTurn(roomId: string) {
  await db
    .update(rooms)
    .set({
      mediationActiveParty: null,
      mediationTurnDeadlineAt: null,
      mediationTurnNudged: false,
    })
    .where(eq(rooms.id, roomId));
}

async function askDialogueQuestion(room: RoomRow, addressee: PartyRole) {
  if (await transitionIfBothReady(room.id, room)) return;
  if (mediationAgentWork.has(room.id)) return;

  mediationAgentWork.add(room.id);
  try {
    await db
      .update(rooms)
      .set({
        mediationActiveParty: addressee,
        mediationTurnDeadlineAt: null,
        mediationTurnNudged: false,
      })
      .where(eq(rooms.id, room.id));

    const { partyA, partyB } = await getRoomPartiesForPipeline(room.id);
    const addresseeUserId =
      addressee === "party_a" ? partyA?.id ?? null : partyB?.id ?? null;

    const { ctx } = await buildContext(room);
    const result = await runMediationAgent({
      mode: "dialogue_question",
      context: ctx,
      schema: mediationDialogueQuestionSchema,
      extraInstruction: `Set addressee to "${addressee}". Round ${room.mediationRound}.`,
    });

    await insertAgentMessage({
      roomId: room.id,
      canonicalContent: result.canonicalContent,
      adaptations: toPartyAdaptations(result),
      messageKind: "mediation_question",
      addresseeUserId,
    });

    await db
      .update(rooms)
      .set({ mediationTurnDeadlineAt: new Date(Date.now() + REPLY_TIMEOUT_MS) })
      .where(eq(rooms.id, room.id));
  } finally {
    mediationAgentWork.delete(room.id);
  }
}

async function postRoundSummary(room: RoomRow) {
  const { ctx } = await buildContext(room);
  const result = await runMediationAgent({
    mode: "round_summary",
    context: ctx,
    schema: mediationRoundSummarySchema,
    extraInstruction: `Round ${room.mediationRound} summary.`,
  });

  await insertAgentMessage({
    roomId: room.id,
    canonicalContent: result.canonicalContent,
    adaptations: toPartyAdaptations(result),
    messageKind: "mediation_summary",
  });
}

async function checkDataSufficiency(room: RoomRow) {
  const { ctx } = await buildContext(room);
  const result = await runMediationAgent({
    mode: "data_sufficiency",
    context: ctx,
    schema: mediationDataSufficiencySchema,
  });
  return result.sufficient;
}

export async function transitionToGeneratingOptions(roomId: string, reason: string) {
  const room = await loadRoom(roomId);
  if (!room || room.mediationPhase === "voting") return;

  if (room.mediationPhase === "generating_options") {
    // Keep completing in-progress generation when something polls/ticks,
    // but do not make one party wait here for the full LLM response.
    void ensureOptionsPublished(roomId).catch((error) => {
      console.error("Failed to ensure mediation options published", error);
    });
    return;
  }

  await clearTurn(roomId);
  await setPhase(roomId, "generating_options", { reason });
  // Publish asynchronously so both parties enter "awaiting options" together
  // via realtime, then both unlock voting when options are written.
  void generateAndPublishOptions(roomId).catch((error) => {
    console.error("Failed to generate mediation options", error);
  });
}

async function ensureOptionsPublished(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room || room.mediationPhase !== "generating_options") return;

  const options = (room.mediationOptions as MediationOption[] | null) ?? [];
  if (options.length > 0) {
    await db
      .update(rooms)
      .set({ mediationPhase: "voting" })
      .where(eq(rooms.id, roomId));
    return;
  }

  await generateAndPublishOptions(roomId);
}

async function generateAndPublishOptions(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room) return;

  if (mediationAgentWork.has(roomId)) return;
  mediationAgentWork.add(roomId);

  try {
    const existing = (room.mediationOptions as MediationOption[] | null) ?? [];
    if (existing.length > 0) {
      if (room.mediationPhase !== "voting") {
        await db
          .update(rooms)
          .set({ mediationPhase: "voting" })
          .where(eq(rooms.id, roomId));
      }
      return;
    }

    const { ctx } = await buildContext(room);
    const result = await runMediationAgent({
      mode: "options",
      context: ctx,
      schema: mediationOptionsSchema,
    });

    const options: MediationOption[] = result.options.map((option) => ({
      id: option.id,
      canonicalDescription: option.canonicalDescription,
      legalNorms: option.legalNorms,
      fulfillmentProbability: option.fulfillmentProbability,
      refusalRisks: option.refusalRisks,
      partyA: option.partyA,
      partyB: option.partyB,
    }));

    await db
      .update(rooms)
      .set({
        mediationOptions: options,
        mediationPhase: "voting",
        partyAVoteOptionId: null,
        partyBVoteOptionId: null,
      })
      .where(eq(rooms.id, roomId));

    const canonical = portalCopy.en.mediationOptionsReady;
    await insertSystemMessage({
      roomId,
      content: canonical,
      canonicalContent: canonical,
      adaptations: toPartyAdaptations({
        canonicalContent: canonical,
        partyA:
          portalCopy[(ctx.partyA.preferredLocale as Locale) ?? "en"].mediationOptionsReady,
        partyB:
          portalCopy[(ctx.partyB.preferredLocale as Locale) ?? "en"].mediationOptionsReady,
      }),
    });

    await logPipelineEvent({
      roomId,
      agentKey: "mediation",
      eventType: "agent_completed",
      payload: { step: "options_published", count: options.length },
    });
  } finally {
    mediationAgentWork.delete(roomId);
  }
}

async function startDialogueRound(room: RoomRow) {
  if (await transitionIfBothReady(room.id, room)) return;

  const round = room.mediationRound <= 0 ? 1 : room.mediationRound;
  await db
    .update(rooms)
    .set({ mediationRound: round, mediationPhase: "dialogue" })
    .where(eq(rooms.id, room.id));

  const updated = { ...room, mediationRound: round, mediationPhase: "dialogue" as const };
  await askDialogueQuestion(updated, "party_a");
}

async function afterPartyReply(room: RoomRow, party: PartyRole) {
  const fresh = (await loadRoom(room.id)) ?? room;
  if (await transitionIfBothReady(room.id, fresh)) return;

  if (party === "party_a") {
    await askDialogueQuestion(fresh, "party_b");
    return;
  }

  await postRoundSummary(fresh);
  const afterSummary = await loadRoom(room.id);
  if (!afterSummary) return;

  if (await transitionIfBothReady(room.id, afterSummary)) return;

  if (isSessionExpired(afterSummary)) {
    await transitionToGeneratingOptions(room.id, "timer_expired");
    return;
  }

  const sufficient = await checkDataSufficiency(afterSummary);
  if (sufficient) {
    await transitionToGeneratingOptions(room.id, "ai_data_sufficiency");
    return;
  }

  if (afterSummary.mediationRound >= MAX_DIALOGUE_ROUNDS) {
    await transitionToGeneratingOptions(room.id, "rounds_complete");
    return;
  }

  await db
    .update(rooms)
    .set({ mediationRound: afterSummary.mediationRound + 1 })
    .where(eq(rooms.id, room.id));

  const nextRound = await loadRoom(room.id);
  if (nextRound) await startDialogueRound(nextRound);
}

async function activatePreparedSession(roomId: string) {
  await db
    .update(rooms)
    .set({ mediationPhase: "dialogue", mediationRound: 1 })
    .where(eq(rooms.id, roomId));

  await logPipelineEvent({
    roomId,
    agentKey: "mediation",
    eventType: "agent_completed",
    payload: { step: "opening", prepared: true },
  });

  await beginTurn(roomId, "party_a");
}

async function hasMessageKindInRoom(roomId: string, messageKind: string) {
  const messages = await listRoomMessages(roomId);
  return messages.some((message) => message.messageKind === messageKind);
}

export async function startMediationSession(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room?.mediationStartedAt) return;

  if (room.mediationPhase) return;

  const complete = await isPostIntakePipelineComplete(roomId);
  if (!complete) return;

  if (!(await isMediationOpeningPrepared(roomId))) {
    const { prepareMediationOpening } = await import("@/lib/mediation/prepare-opening");
    await prepareMediationOpening(roomId);
  }

  if (await isMediationOpeningPrepared(roomId)) {
    await activatePreparedSession(roomId);
    return;
  }

  await db
    .update(rooms)
    .set({ mediationPhase: "opening", mediationRound: 0 })
    .where(eq(rooms.id, roomId));

  await logPipelineEvent({
    roomId,
    agentKey: "mediation",
    eventType: "agent_started",
    payload: { step: "opening" },
  });

  const refreshed = await loadRoom(roomId);
  if (refreshed) await runOpeningPhase(refreshed);
}

async function runOpeningPhase(room: RoomRow) {
  if (await isMediationOpeningPrepared(room.id)) {
    await activatePreparedSession(room.id);
    return;
  }

  const hasOpening = await hasMessageKindInRoom(room.id, "mediation_opening");
  if (!hasOpening) {
    const { ctx } = await buildContext(room);
    const opening = await runMediationAgent({
      mode: "opening",
      context: ctx,
      schema: mediationOpeningSchema,
    });

    await insertAgentMessage({
      roomId: room.id,
      canonicalContent: opening.canonicalContent,
      adaptations: toPartyAdaptations(opening),
      messageKind: "mediation_opening",
    });
  }

  const hasQuestion = await hasMessageKindInRoom(room.id, "mediation_question");
  await db
    .update(rooms)
    .set({ mediationRound: 1, mediationPhase: "dialogue" })
    .where(eq(rooms.id, room.id));

  if (hasQuestion) {
    await beginTurn(room.id, "party_a");
    return;
  }

  const updated = await loadRoom(room.id);
  if (updated) await askDialogueQuestion({ ...updated, mediationRound: 1, mediationPhase: "dialogue" }, "party_a");
}

async function ensureCompromiseOption(room: RoomRow) {
  if (room.mediationPhase !== "voting_discrepancy" || room.compromiseOption) return;
  if (!room.partyAVoteOptionId || !room.partyBVoteOptionId) return;
  if (room.partyAVoteOptionId === room.partyBVoteOptionId) return;
  if (mediationAgentWork.has(room.id)) return;

  mediationAgentWork.add(room.id);
  try {
    const fresh = await loadRoom(room.id);
    if (!fresh || fresh.compromiseOption) return;

    const { ctx } = await buildContext(fresh);
    const compromise = await runMediationAgent({
      mode: "compromise",
      context: ctx,
      schema: mediationCompromiseSchema,
      extraInstruction: `Party A voted ${fresh.partyAVoteOptionId}, Party B voted ${fresh.partyBVoteOptionId}.`,
    });

    const compromiseOption: MediationOption = {
      id: compromise.option.id,
      canonicalDescription: compromise.option.canonicalDescription,
      legalNorms: compromise.option.legalNorms,
      fulfillmentProbability: compromise.option.fulfillmentProbability,
      refusalRisks: compromise.option.refusalRisks,
      partyA: compromise.option.partyA,
      partyB: compromise.option.partyB,
    };

    await db
      .update(rooms)
      .set({ compromiseOption })
      .where(eq(rooms.id, room.id));
  } finally {
    mediationAgentWork.delete(room.id);
  }
}

async function ensureDraftAgreement(room: RoomRow) {
  if (room.mediationPhase !== "agreement" || room.draftAgreement || !room.selectedOptionId) return;
  if (mediationAgentWork.has(room.id)) return;

  mediationAgentWork.add(room.id);
  try {
    await generateDraftAgreement(room.id, room.selectedOptionId);
  } finally {
    mediationAgentWork.delete(room.id);
  }
}

export async function tickMediationTimers(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room?.mediationStartedAt || room.mediationPhase === "completed") return room;

  if (
    isSessionExpired(room) &&
    room.mediationPhase &&
    ["opening", "dialogue", "generating_options"].includes(room.mediationPhase)
  ) {
    if (room.mediationPhase !== "generating_options") {
      await transitionToGeneratingOptions(roomId, "timer_expired");
    } else {
      void ensureOptionsPublished(roomId).catch((error) => {
        console.error("Failed to ensure mediation options published", error);
      });
    }
    return loadRoom(roomId);
  }

  if (room.mediationPhase === "generating_options") {
    // Kick generation without awaiting so one side's refresh does not "win" voting alone.
    void ensureOptionsPublished(roomId).catch((error) => {
      console.error("Failed to ensure mediation options published", error);
    });
    return loadRoom(roomId);
  }

  if (room.mediationPhase === "voting_discrepancy") {
    void ensureCompromiseOption(room).catch((error) => {
      console.error("Failed to ensure compromise option", error);
    });
    return loadRoom(roomId);
  }

  if (room.mediationPhase === "agreement") {
    void ensureDraftAgreement(room).catch((error) => {
      console.error("Failed to ensure draft agreement", error);
    });
    return loadRoom(roomId);
  }

  if (
    room.mediationPhase === "dialogue" &&
    room.mediationActiveParty &&
    room.mediationTurnDeadlineAt &&
    Date.now() > room.mediationTurnDeadlineAt.getTime()
  ) {
    const timedOutParty = room.mediationActiveParty as PartyRole;
    await clearTurn(roomId);
    const fresh = await loadRoom(roomId);
    if (fresh) await afterPartyReply(fresh, timedOutParty);
  }

  if (bothReady(room) && isNegotiationPhase(room.mediationPhase)) {
    await transitionToGeneratingOptions(roomId, "both_ready");
    return loadRoom(roomId);
  }

  return loadRoom(roomId);
}

export async function submitDialogueReply(userId: string, content: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Not in a room.");

  const room = await loadRoom(participant.roomId);
  if (!room || room.mediationPhase !== "dialogue") throw new Error("Dialogue is not active.");

  const role = partyRoleFromUser(participant.user);
  if (room.mediationActiveParty !== role) throw new Error("Not your turn.");

  if (room.mediationTurnDeadlineAt && Date.now() > room.mediationTurnDeadlineAt.getTime()) {
    throw new Error("Reply window expired.");
  }

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Reply cannot be empty.");

  if (isAttackHeuristic(trimmed)) {
    const { ctx } = await buildContext(room);
    const redirect = await runMediationAgent({
      mode: "moderation_redirect",
      context: ctx,
      schema: mediationModerationSchema,
      extraInstruction: `Redirect ${role} after a personal attack.`,
    });

    await insertAgentMessage({
      roomId: room.id,
      canonicalContent: redirect.canonicalContent,
      adaptations: toPartyAdaptations(redirect),
      messageKind: "mediation_moderation",
      addresseeUserId: userId,
    });

    return { moderated: true as const };
  }

  await insertParticipantMessage({
    roomId: room.id,
    userId,
    content: trimmed,
  });

  await clearTurn(room.id);
  const fresh = await loadRoom(room.id);
  if (fresh) await afterPartyReply(fresh, role);

  return { moderated: false as const };
}

export async function markReadyForOptions(userId: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Not in a room.");

  const room = await loadRoom(participant.roomId);
  if (!room || !isNegotiationPhase(room.mediationPhase)) {
    throw new Error("Ready for options is only available during mediation.");
  }

  const role = partyRoleFromUser(participant.user);
  const alreadyReady =
    role === "party_a" ? room.partyAReadyForOptionsAt : room.partyBReadyForOptionsAt;
  if (alreadyReady) {
    await tickMediationTimers(participant.roomId);
    return;
  }

  const patch =
    role === "party_a"
      ? { partyAReadyForOptionsAt: new Date() }
      : { partyBReadyForOptionsAt: new Date() };

  await db.update(rooms).set(patch).where(eq(rooms.id, participant.roomId));
  await tickMediationTimers(participant.roomId);
}

export async function castVote(userId: string, optionId: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Not in a room.");

  const room = await loadRoom(participant.roomId);
  if (!room || room.mediationPhase !== "voting") throw new Error("Voting is not open.");

  const options = (room.mediationOptions as MediationOption[] | null) ?? [];
  if (!options.some((option) => option.id === optionId)) throw new Error("Invalid option.");

  const role = partyRoleFromUser(participant.user);
  const patch =
    role === "party_a"
      ? { partyAVoteOptionId: optionId }
      : { partyBVoteOptionId: optionId };

  await db.update(rooms).set(patch).where(eq(rooms.id, room.id));

  const updated = await loadRoom(room.id);
  if (!updated?.partyAVoteOptionId || !updated.partyBVoteOptionId) return updated;

  if (updated.partyAVoteOptionId === updated.partyBVoteOptionId) {
    await db
      .update(rooms)
      .set({
        selectedOptionId: updated.partyAVoteOptionId,
        mediationPhase: "agreement",
      })
      .where(eq(rooms.id, room.id));
    // Draft generation continues in the background so both parties unlock together.
    void ensureDraftAgreement({
      ...updated,
      selectedOptionId: updated.partyAVoteOptionId,
      mediationPhase: "agreement",
    }).catch((error) => {
      console.error("Failed to generate draft agreement after matching votes", error);
    });
    return loadRoom(room.id);
  }

  // Enter discrepancy immediately; generate compromise asynchronously so both
  // parties see awaiting → compromise buttons at the same time via realtime.
  await setPhase(room.id, "voting_discrepancy");
  await db
    .update(rooms)
    .set({
      compromiseOption: null,
      partyACompromiseVote: null,
      partyBCompromiseVote: null,
    })
    .where(eq(rooms.id, room.id));

  const discrepancyRoom = await loadRoom(room.id);
  if (discrepancyRoom) {
    void ensureCompromiseOption(discrepancyRoom).catch((error) => {
      console.error("Failed to generate compromise option", error);
    });
  }

  return discrepancyRoom;
}

export async function castCompromiseVote(userId: string, accepted: boolean) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Not in a room.");

  const room = await loadRoom(participant.roomId);
  if (!room || room.mediationPhase !== "voting_discrepancy") {
    throw new Error("Compromise vote is not open.");
  }

  const role = partyRoleFromUser(participant.user);
  const patch =
    role === "party_a"
      ? { partyACompromiseVote: accepted }
      : { partyBCompromiseVote: accepted };

  await db.update(rooms).set(patch).where(eq(rooms.id, room.id));
  const updated = await loadRoom(room.id);
  if (!updated) return null;

  if (updated.partyACompromiseVote === null || updated.partyBCompromiseVote === null) {
    return updated;
  }

  if (updated.partyACompromiseVote && updated.partyBCompromiseVote) {
    const compromise = updated.compromiseOption as MediationOption | null;
    if (!compromise) throw new Error("Compromise option missing.");

    await db
      .update(rooms)
      .set({
        selectedOptionId: compromise.id,
        mediationPhase: "agreement",
      })
      .where(eq(rooms.id, room.id));

    void ensureDraftAgreement({
      ...updated,
      selectedOptionId: compromise.id,
      mediationPhase: "agreement",
    }).catch((error) => {
      console.error("Failed to generate draft agreement after compromise accept", error);
    });
    return loadRoom(room.id);
  }

  await db
    .update(rooms)
    .set({
      mediationPhase: "completed",
      mediationCompletedAt: new Date(),
    })
    .where(eq(rooms.id, room.id));

  return loadRoom(room.id);
}

async function generateDraftAgreement(roomId: string, optionId: string) {
  const room = await loadRoom(roomId);
  if (!room) return;

  const { ctx } = await buildContext(room);
  const draft = await runMediationAgent({
    mode: "agreement_draft",
    context: ctx,
    schema: mediationAgreementDraftSchema,
    extraInstruction: `Selected option id: ${optionId}`,
  });

  await db
    .update(rooms)
    .set({
      draftAgreement: {
        ...draft,
        generatedAt: new Date().toISOString(),
      },
    })
    .where(eq(rooms.id, roomId));
}

export async function acceptAgreement(userId: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) throw new Error("Not in a room.");

  const room = await loadRoom(participant.roomId);
  if (!room || room.mediationPhase !== "agreement") throw new Error("Agreement not ready.");

  const role = partyRoleFromUser(participant.user);
  const now = new Date();
  const patch =
    role === "party_a"
      ? { partyAAgreementAcceptedAt: now }
      : { partyBAgreementAcceptedAt: now };

  await db.update(rooms).set(patch).where(eq(rooms.id, room.id));
  const updated = await loadRoom(room.id);
  if (!updated?.partyAAgreementAcceptedAt || !updated.partyBAgreementAcceptedAt) {
    return updated;
  }

  const finalizedAt = new Date();
  await db
    .update(rooms)
    .set({
      agreementFinalizedAt: finalizedAt,
      mediationPhase: "completed",
      mediationCompletedAt: finalizedAt,
    })
    .where(eq(rooms.id, room.id));

  const draft = updated.draftAgreement as { title: string; body: string; terms: string[] } | null;
  const hash = createHash("sha256")
    .update(JSON.stringify(draft ?? {}))
    .digest("hex");

  await db.insert(mediationFilingReceipts).values({
    roomId: room.id,
    selectedOptionId: updated.selectedOptionId ?? "unknown",
    documentVersion: "1",
    contentHash: hash,
    partyAAcceptedAt: updated.partyAAgreementAcceptedAt,
    partyBAcceptedAt: updated.partyBAgreementAcceptedAt,
  });

  return loadRoom(room.id);
}

export async function getMediationRoomState(userId: string) {
  const { getParticipantRoom } = await import("@/lib/room/helpers");
  const participant = await getParticipantRoom(userId);
  if (!participant) return null;

  let room = await loadRoom(participant.roomId);
  if (!room?.mediationStartedAt) return null;

  if (!room.mediationPhase) {
    if (room.mediationStartedAt && isSessionExpired(room)) {
      await db
        .update(rooms)
        .set({
          mediationPhase: "completed",
          mediationCompletedAt: new Date(),
        })
        .where(eq(rooms.id, room.id));
      room = (await loadRoom(room.id)) ?? room;
    } else {
      try {
        await startMediationSession(room.id);
      } catch (error) {
        console.error("Failed to start mediation session", error);
      }
    }
  }

  if (room!.mediationPhase !== "completed") {
    room = (await tickMediationTimers(room!.id)) ?? room;
  }

  const role = partyRoleFromUser(participant.user);
  const { partyA, partyB } = await getRoomPartiesForPipeline(participant.roomId);
  const messages = await listRoomMessages(room!.id);
  const options = (room!.mediationOptions as MediationOption[] | null) ?? [];
  const compromise = room!.compromiseOption as MediationOption | null;

  const visibilityContext = {
    allMessages: messages,
    partyAUserId: partyA?.id ?? "",
    partyBUserId: partyB?.id ?? "",
  };

  const viewerMessages = messages
    .filter((message) =>
      partyA?.id && partyB?.id
        ? isMessageVisibleToViewer(message, userId, visibilityContext)
        : message.senderUserId === userId || message.senderType !== "participant",
    )
    .map((message) => ({
      id: message.id,
      senderType: message.senderType,
      messageKind: message.messageKind,
      content: resolveMessageForViewer(message, role, participant.user.preferredLocale),
      createdAt: message.createdAt.toISOString(),
      isOwn: message.senderUserId === userId,
    }));

  const mapOption = (option: MediationOption) => ({
    id: option.id,
    description: role === "party_a" ? option.partyA : option.partyB,
    legalNorms: option.legalNorms,
    fulfillmentProbability: option.fulfillmentProbability,
    refusalRisks: option.refusalRisks,
  });

  const otherVoteVisible =
    room!.mediationPhase === "voting_discrepancy" ||
    room!.mediationPhase === "agreement" ||
    room!.mediationPhase === "completed";

  const showAllVotes =
    room!.mediationPhase === "voting_discrepancy" ||
    room!.mediationPhase === "agreement" ||
    room!.mediationPhase === "completed";

  const isAwaitingAgent =
    room!.mediationPhase === "generating_options" ||
    (room!.mediationPhase === "dialogue" && !room!.mediationActiveParty) ||
    (room!.mediationPhase === "agreement" && !room!.draftAgreement) ||
    (room!.mediationPhase === "voting_discrepancy" && !room!.compromiseOption);

  const statePayload = {
    room: {
      id: room!.id,
      title: room!.title,
      phase: room!.mediationPhase,
      round: room!.mediationRound,
      activeParty: room!.mediationActiveParty,
      isAwaitingAgent,
      turnDeadlineAt: room!.mediationTurnDeadlineAt?.toISOString() ?? null,
      mediationStartedAt: room!.mediationStartedAt!.toISOString(),
      mediationDurationMinutes: room!.mediationDurationMinutes,
      selfReady: role === "party_a" ? !!room!.partyAReadyForOptionsAt : !!room!.partyBReadyForOptionsAt,
      otherReady: role === "party_a" ? !!room!.partyBReadyForOptionsAt : !!room!.partyAReadyForOptionsAt,
      selfVote: role === "party_a" ? room!.partyAVoteOptionId : room!.partyBVoteOptionId,
      otherVote: otherVoteVisible
        ? role === "party_a"
          ? room!.partyBVoteOptionId
          : room!.partyAVoteOptionId
        : null,
      partyAVoteOptionId: showAllVotes ? room!.partyAVoteOptionId : null,
      partyBVoteOptionId: showAllVotes ? room!.partyBVoteOptionId : null,
      partyACompromiseVote: showAllVotes ? room!.partyACompromiseVote : null,
      partyBCompromiseVote: showAllVotes ? room!.partyBCompromiseVote : null,
      selfCompromiseVote:
        role === "party_a" ? room!.partyACompromiseVote : room!.partyBCompromiseVote,
      selfAccepted:
        role === "party_a" ? !!room!.partyAAgreementAcceptedAt : !!room!.partyBAgreementAcceptedAt,
      otherAccepted:
        role === "party_a" ? !!room!.partyBAgreementAcceptedAt : !!room!.partyAAgreementAcceptedAt,
      selectedOptionId: room!.selectedOptionId,
      draftAgreement: room!.draftAgreement,
    },
    viewerRole: role,
    messages: viewerMessages,
    options: options.map(mapOption),
    compromise: compromise ? mapOption(compromise) : null,
  };

  if (room!.mediationPhase !== "completed") {
    return statePayload;
  }

  const locale = (participant.user.preferredLocale as Locale) ?? "en";
  const resultsSummary = await buildMediationResultsSummary(statePayload, locale);

  return {
    ...statePayload,
    resultsSummary,
  };
}

export async function buildMediationTestContext(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room) throw new Error("Room not found.");

  const complete = await isPostIntakePipelineComplete(roomId);
  if (!complete) throw new Error("Post-intake pipeline not complete for this room.");

  const { partyA, partyB, ctx } = await buildContext(room);
  return { room, partyA, partyB, context: ctx };
}
