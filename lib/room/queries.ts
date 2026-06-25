import { and, asc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  roomMessages,
  roomPipelineStates,
  rooms,
  situationDescriptions,
  users,
} from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { getMessageContent } from "@/lib/pipeline/resolve-message-locale";
import { allSidesSubmitted, getRoomSides } from "@/lib/room/helpers";

export type RoomMessageView = {
  id: string;
  channel: "shared" | "private";
  senderType: "participant" | "agent";
  senderAgent: string | null;
  senderUserId: string | null;
  senderRole: string | null;
  content: string;
  messageMetadata: Record<string, unknown> | null;
  createdAt: Date;
};

export async function getRoomPageData(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.roomId) return null;

  const [room] = await db.select().from(rooms).where(eq(rooms.id, user.roomId)).limit(1);
  if (!room) return null;

  const [pipeline] = await db
    .select()
    .from(roomPipelineStates)
    .where(eq(roomPipelineStates.roomId, user.roomId))
    .limit(1);

  const sides = await getRoomSides(user.roomId);
  const submissions = await db
    .select()
    .from(situationDescriptions)
    .where(eq(situationDescriptions.roomId, user.roomId));

  const allSubmitted = await allSidesSubmitted(user.roomId);
  const viewerLocale = (user.preferredLocale as Locale) ?? "en";
  const ownSubmission = submissions.find((s) => s.userId === userId) ?? null;

  const visibleSituations =
    allSubmitted
      ? submissions.map((s) => {
          const side = sides.find((u) => u.id === s.userId);
          return {
            userId: s.userId,
            role: side?.role ?? "side1",
            title: side?.title ?? "",
            whatHappened: s.whatHappened,
            whyDispute: s.whyDispute,
            supportingInfo: s.supportingInfo,
            submittedAt: s.submittedAt,
          };
        })
      : ownSubmission
        ? [
            {
              userId: ownSubmission.userId,
              role: user.role,
              title: user.title,
              whatHappened: ownSubmission.whatHappened,
              whyDispute: ownSubmission.whyDispute,
              supportingInfo: ownSubmission.supportingInfo,
              submittedAt: ownSubmission.submittedAt,
            },
          ]
        : [];

  const messageRows = await db
    .select()
    .from(roomMessages)
    .where(
      and(
        eq(roomMessages.roomId, user.roomId),
        or(
          eq(roomMessages.channel, "shared"),
          and(eq(roomMessages.channel, "private"), eq(roomMessages.participantUserId, userId)),
        ),
      ),
    )
    .orderBy(asc(roomMessages.createdAt));

  const participantMap = new Map(
    (
      await db.select().from(users).where(eq(users.roomId, user.roomId))
    ).map((u) => [u.id, u]),
  );

  const messages: RoomMessageView[] = messageRows.map((m) => ({
    id: m.id,
    channel: m.channel,
    senderType: m.senderType,
    senderAgent: m.senderAgent,
    senderUserId: m.senderUserId,
    senderRole: m.senderUserId ? (participantMap.get(m.senderUserId)?.role ?? null) : null,
    content: getMessageContent(
      {
        content: m.content,
        contentByLocale: m.contentByLocale as { en: string; uk: string } | null,
      },
      viewerLocale,
    ),
    messageMetadata: m.messageMetadata as Record<string, unknown> | null,
    createdAt: m.createdAt,
  }));

  const sharedMessages = messages.filter((m) => m.channel === "shared");
  const privateMessages = messages.filter((m) => m.channel === "private");

  const activeOptionsMessage = [...sharedMessages]
    .reverse()
    .find((m) => m.messageMetadata?.kind === "resolution_options");

  return {
    room,
    pipeline: pipeline ?? { status: "awaiting_situations" as const },
    user,
    viewerLocale,
    hasSubmitted: !!ownSubmission,
    allSidesSubmitted: allSubmitted,
    visibleSituations,
    sharedMessages,
    privateMessages,
    activeOptionsMessage,
    waitingForOthers: !!ownSubmission && !allSubmitted,
    sideCount: sides.length,
  };
}
