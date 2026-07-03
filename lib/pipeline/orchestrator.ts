import { runEmotionalTriggersAgent } from "@/lib/pipeline/agents/emotional-triggers";
import { runInterestsAgent } from "@/lib/pipeline/agents/interests";
import { runLegalAnalysisAgent } from "@/lib/pipeline/agents/legal-analysis";
import { runPsychodynamicAgent } from "@/lib/pipeline/agents/psychodynamic";
import {
  canTriggerPostIntakePipeline,
  getRoomSidesForPipeline,
  isPostIntakePipelineComplete,
  markPipelineCompleted,
  markPipelineStarted,
} from "@/lib/pipeline/gate";
import { logPipelineEvent } from "@/lib/pipeline/log-event";

const runningRooms = new Set<string>();

async function runAgentSafely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (error) {
    console.error(`Post-intake pipeline: ${label} failed:`, error);
  }
}

export async function runPostIntakePipeline(roomId: string) {
  if (runningRooms.has(roomId)) return;
  if (!(await canTriggerPostIntakePipeline(roomId))) return;
  if (await isPostIntakePipelineComplete(roomId)) return;

  runningRooms.add(roomId);

  try {
    await markPipelineStarted(roomId);
    await logPipelineEvent({ roomId, eventType: "pipeline_triggered" });

    const { side1, side2 } = await getRoomSidesForPipeline(roomId);
    if (!side1 || !side2) return;

    await Promise.all([
      runAgentSafely("psychodynamic side1", () =>
        runPsychodynamicAgent({ userId: side1.id, roomId }),
      ),
      runAgentSafely("psychodynamic side2", () =>
        runPsychodynamicAgent({ userId: side2.id, roomId }),
      ),
      runAgentSafely("emotional triggers side1", () =>
        runEmotionalTriggersAgent({ userId: side1.id, roomId }),
      ),
      runAgentSafely("emotional triggers side2", () =>
        runEmotionalTriggersAgent({ userId: side2.id, roomId }),
      ),
    ]);

    await Promise.all([
      runAgentSafely("interests", () => runInterestsAgent({ roomId })),
      runAgentSafely("legal analysis", () => runLegalAnalysisAgent({ roomId })),
    ]);

    if (await isPostIntakePipelineComplete(roomId)) {
      await markPipelineCompleted(roomId);
      await logPipelineEvent({ roomId, eventType: "pipeline_completed" });
    } else {
      await logPipelineEvent({
        roomId,
        eventType: "agent_failed",
        payload: { message: "Pipeline finished with incomplete agent outputs" },
      });
    }
  } finally {
    runningRooms.delete(roomId);
  }
}
