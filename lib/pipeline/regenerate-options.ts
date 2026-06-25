import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { roomMessages, roomPipelineStates } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { runSynthesisRegenerate } from "@/lib/pipeline/agents/synthesis";
import { logPipelineEvent } from "@/lib/pipeline/event-log";
import { OPTIONS_MESSAGE_KIND } from "@/lib/pipeline/types";
import {
  getRoomSides,
  getSideLocales,
  insertAgentSharedMessage,
} from "@/lib/room/helpers";
import { loadPipelineContextForRoom } from "@/lib/room/pipeline-context";

export async function regenerateResolutionOptions(roomId: string, rejectionReason: string) {
  const ctx = await loadPipelineContextForRoom(roomId);
  const sides = await getRoomSides(roomId);
  const locales = sides.map((s) => (s.preferredLocale as Locale) ?? "en");

  const messages = await db
    .select()
    .from(roomMessages)
    .where(eq(roomMessages.roomId, roomId));

  const dialogueHistory = messages
    .filter((m) => m.channel === "shared")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((m) => `${m.senderType}: ${m.content}`)
    .join("\n");

  const version =
    messages.filter(
      (m) => m.messageMetadata && (m.messageMetadata as { kind?: string }).kind === OPTIONS_MESSAGE_KIND,
    ).length + 1;

  await logPipelineEvent(roomId, "regenerate_started", "synthesis");

  const { options, content, localized } = await runSynthesisRegenerate(
    { ...ctx, dialogueHistory, rejectionReason },
    locales,
  );

  await insertAgentSharedMessage(roomId, "synthesis", content, localized, {
    kind: OPTIONS_MESSAGE_KIND,
    options,
    optionsVersion: version,
  });

  await db
    .update(roomPipelineStates)
    .set({ status: "post_resolution", updatedAt: new Date() })
    .where(eq(roomPipelineStates.roomId, roomId));

  await logPipelineEvent(roomId, "options_regenerated", "synthesis", { version });
}
