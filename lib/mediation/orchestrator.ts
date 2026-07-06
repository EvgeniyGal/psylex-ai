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
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import { getRoomPartiesForPipeline, isPostIntakePipelineComplete } from "@/lib/pipeline/gate";
import type { PartyRole } from "@/lib/participant-roles";

type RoomRow = typeof rooms.$inferSelect;

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
  });

  await beginTurn(room.id, addressee);
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
  if (!room || room.mediationPhase === "generating_options" || room.mediationPhase === "voting") {
    return;
  }

  await clearTurn(roomId);
  await setPhase(roomId, "generating_options", { reason });
  await generateAndPublishOptions(roomId);
}

async function generateAndPublishOptions(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room) return;

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
}

async function startDialogueRound(room: RoomRow) {
  const round = room.mediationRound <= 0 ? 1 : room.mediationRound;
  await db
    .update(rooms)
    .set({ mediationRound: round, mediationPhase: "dialogue" })
    .where(eq(rooms.id, room.id));

  const updated = { ...room, mediationRound: round, mediationPhase: "dialogue" as const };
  await askDialogueQuestion(updated, "party_a");
}

async function afterPartyReply(room: RoomRow, party: PartyRole) {
  if (party === "party_a") {
    await askDialogueQuestion(room, "party_b");
    return;
  }

  await postRoundSummary(room);
  const fresh = await loadRoom(room.id);
  if (!fresh) return;

  if (bothReady(fresh)) {
    await transitionToGeneratingOptions(room.id, "both_ready");
    return;
  }

  if (isSessionExpired(fresh)) {
    await transitionToGeneratingOptions(room.id, "timer_expired");
    return;
  }

  const sufficient = await checkDataSufficiency(fresh);
  if (sufficient) {
    await transitionToGeneratingOptions(room.id, "ai_data_sufficiency");
    return;
  }

  if (fresh.mediationRound >= MAX_DIALOGUE_ROUNDS) {
    await transitionToGeneratingOptions(room.id, "rounds_complete");
    return;
  }

  await db
    .update(rooms)
    .set({ mediationRound: fresh.mediationRound + 1 })
    .where(eq(rooms.id, room.id));

  const nextRound = await loadRoom(room.id);
  if (nextRound) await startDialogueRound(nextRound);
}

export async function startMediationSession(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room?.mediationStartedAt) return;

  if (room.mediationPhase) return;

  const complete = await isPostIntakePipelineComplete(roomId);
  if (!complete) return;

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

  await db
    .update(rooms)
    .set({ mediationRound: 1 })
    .where(eq(rooms.id, room.id));

  await setPhase(room.id, "dialogue");
  const updated = await loadRoom(room.id);
  if (updated) await startDialogueRound(updated);
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
    }
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

  if (bothReady(room) && room.mediationPhase === "dialogue") {
    await transitionToGeneratingOptions(roomId, "both_ready");
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

  const role = partyRoleFromUser(participant.user);
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
    await generateDraftAgreement(room.id, updated.partyAVoteOptionId);
    return loadRoom(room.id);
  }

  await setPhase(room.id, "voting_discrepancy");
  const { ctx } = await buildContext(updated);
  const compromise = await runMediationAgent({
    mode: "compromise",
    context: ctx,
    schema: mediationCompromiseSchema,
    extraInstruction: `Party A voted ${updated.partyAVoteOptionId}, Party B voted ${updated.partyBVoteOptionId}.`,
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
    .set({
      compromiseOption,
      partyACompromiseVote: null,
      partyBCompromiseVote: null,
    })
    .where(eq(rooms.id, room.id));

  return loadRoom(room.id);
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

    await generateDraftAgreement(room.id, compromise.id);
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
      await startMediationSession(room.id);
      room = await loadRoom(room.id);
    }
  }

  if (room!.mediationPhase !== "completed") {
    room = (await tickMediationTimers(room!.id)) ?? room;
  }

  const role = partyRoleFromUser(participant.user);
  const messages = await listRoomMessages(room!.id);
  const options = (room!.mediationOptions as MediationOption[] | null) ?? [];
  const compromise = room!.compromiseOption as MediationOption | null;

  const viewerMessages = messages.map((message) => ({
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

  const statePayload = {
    room: {
      id: room!.id,
      title: room!.title,
      phase: room!.mediationPhase,
      round: room!.mediationRound,
      activeParty: room!.mediationActiveParty,
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
