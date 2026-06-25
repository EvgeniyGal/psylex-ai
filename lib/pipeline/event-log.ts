import { db } from "@/lib/db";
import { pipelineEventLogs } from "@/drizzle/schema";
import type { AgentKey } from "@/drizzle/schema";

export async function logPipelineEvent(
  roomId: string,
  eventType: string,
  agentKey?: AgentKey | null,
  payload?: Record<string, unknown>,
) {
  await db.insert(pipelineEventLogs).values({
    roomId,
    eventType,
    agentKey: agentKey ?? null,
    payload: payload ?? null,
  });
}
