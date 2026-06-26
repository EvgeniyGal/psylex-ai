import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomMessages } from "@/drizzle/schema";
import type { LegalDomainSideInput, PipelineContext } from "@/lib/pipeline/types";
import { getRoomSides } from "@/lib/room/helpers";

export async function buildLegalDomainSideInputs(
  roomId: string,
  ctx: PipelineContext,
): Promise<LegalDomainSideInput[]> {
  const sides = await getRoomSides(roomId);
  const rows = await db
    .select()
    .from(roomMessages)
    .where(eq(roomMessages.roomId, roomId));

  return sides.map((side) => {
    const situation = ctx.situations.find((s) => s.userId === side.id) ?? null;
    const thread = rows
      .filter((m) => m.channel === "private" && m.participantUserId === side.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const priorClarifications: Array<{ question: string; answer: string }> = [];
    for (let i = 0; i < thread.length - 1; i++) {
      const current = thread[i];
      const next = thread[i + 1];
      if (
        current.senderType === "agent" &&
        current.senderAgent === "legal_domain" &&
        next.senderType === "participant"
      ) {
        priorClarifications.push({ question: current.content, answer: next.content });
      }
    }

    return {
      userId: side.id,
      role: side.role,
      situation: situation
        ? {
            whatHappened: situation.whatHappened,
            whyDispute: situation.whyDispute,
            supportingInfo: situation.supportingInfo,
          }
        : null,
      priorClarifications,
    };
  });
}

export function getLatestClarificationAnswer(side: LegalDomainSideInput): string {
  return side.priorClarifications.at(-1)?.answer.trim() ?? "";
}

export function getLatestClarificationAnswers(
  participants: LegalDomainSideInput[],
): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const side of participants) {
    const answer = getLatestClarificationAnswer(side);
    if (answer) answers[side.userId] = answer;
  }
  return answers;
}
