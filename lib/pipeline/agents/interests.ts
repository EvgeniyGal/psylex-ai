import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { assembleInterestsInput } from "@/lib/pipeline/assemble-input";
import { getRoomSidesForPipeline, isRoomInterestsComplete } from "@/lib/pipeline/gate";
import { logPipelineEvent } from "@/lib/pipeline/log-event";
import {
  getUniqueRoomLocales,
  mergeLocalizedOutputs,
  normalizeLocale,
} from "@/lib/pipeline/locale";
import { runAgent } from "@/lib/pipeline/run-agent";
import type { InterestsAnalysis, PsychodynamicProfile } from "@/lib/pipeline/schemas";

type RunInterestsParams = {
  roomId: string;
  draftPrompt?: string;
  dryRun?: boolean;
  targetLocale?: Locale;
};

async function generateInterestsForLocale(params: {
  side1: Awaited<ReturnType<typeof getRoomSidesForPipeline>>["side1"];
  side2: Awaited<ReturnType<typeof getRoomSidesForPipeline>>["side2"];
  locale: Locale;
  draftPrompt?: string;
}) {
  if (!params.side1 || !params.side2) {
    throw new Error("Room must have both sides.");
  }

  const { result } = await runAgent({
    agentKey: "interests",
    userMessage: assembleInterestsInput({
      side1: params.side1,
      side2: params.side2,
      side1Profile: params.side1.psychodynamicProfile as PsychodynamicProfile | null,
      side2Profile: params.side2.psychodynamicProfile as PsychodynamicProfile | null,
    }),
    draftPrompt: params.draftPrompt,
    targetLocale: params.locale,
  });

  return result;
}

export async function runInterestsAgent(params: RunInterestsParams) {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, params.roomId)).limit(1);
  if (!room) throw new Error("Room not found.");

  const { side1, side2 } = await getRoomSidesForPipeline(params.roomId);
  if (!side1 || !side2) throw new Error("Room must have both sides.");

  if (!params.dryRun && isRoomInterestsComplete(room)) {
    await logPipelineEvent({
      roomId: params.roomId,
      agentKey: "interests",
      eventType: "agent_skipped",
    });
    return room.interestsAnalysis;
  }

  if (!params.dryRun) {
    await logPipelineEvent({
      roomId: params.roomId,
      agentKey: "interests",
      eventType: "agent_started",
    });
  }

  try {
    const locales = params.dryRun
      ? [params.targetLocale ?? normalizeLocale(side1.preferredLocale)]
      : getUniqueRoomLocales([side1, side2]);

    const byLocale: Partial<Record<Locale, InterestsAnalysis>> = {};

    for (const locale of locales) {
      byLocale[locale] = await generateInterestsForLocale({
        side1,
        side2,
        locale,
        draftPrompt: params.draftPrompt,
      });
    }

    const result = params.dryRun
      ? byLocale[locales[0]!]!
      : mergeLocalizedOutputs(byLocale);

    if (!params.dryRun) {
      await db
        .update(rooms)
        .set({
          interestsAnalysis: result,
          interestsAnalysisAt: new Date(),
        })
        .where(eq(rooms.id, params.roomId));

      await logPipelineEvent({
        roomId: params.roomId,
        agentKey: "interests",
        eventType: "agent_completed",
      });
    }

    return result;
  } catch (error) {
    if (!params.dryRun) {
      await logPipelineEvent({
        roomId: params.roomId,
        agentKey: "interests",
        eventType: "agent_failed",
        payload: { message: error instanceof Error ? error.message : "Unknown error" },
      });
    }
    throw error;
  }
}
