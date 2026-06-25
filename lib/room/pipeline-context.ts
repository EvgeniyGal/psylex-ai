import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomPipelineStates, situationDescriptions } from "@/drizzle/schema";
import { buildProfilesForUsers } from "@/lib/pipeline/psychological-profile";
import type { PipelineContext, SituationInput } from "@/lib/pipeline/types";
import { getRoomSides, getSideLocales } from "@/lib/room/helpers";

export async function loadPipelineContextForRoom(roomId: string): Promise<PipelineContext> {
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
