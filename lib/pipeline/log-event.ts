import { db } from "@/lib/db";
import { pipelineEventLogs } from "@/drizzle/schema";
import type { AgentKey, PipelineEventType } from "@/lib/pipeline/agent-keys";

type LogEventParams = {
  roomId: string;
  eventType: PipelineEventType;
  agentKey?: AgentKey;
  userId?: string;
  payload?: Record<string, unknown>;
};

export async function logPipelineEvent(params: LogEventParams) {
  await db.insert(pipelineEventLogs).values({
    roomId: params.roomId,
    userId: params.userId ?? null,
    agentKey: params.agentKey ?? null,
    eventType: params.eventType,
    payload: params.payload ?? null,
  });
}
