import { runEmotionalTriggersAgent } from "@/lib/pipeline/agents/emotional-triggers";
import { runInterestsAgent } from "@/lib/pipeline/agents/interests";
import { runLegalAnalysisAgent } from "@/lib/pipeline/agents/legal-analysis";
import { runPsychodynamicAgent } from "@/lib/pipeline/agents/psychodynamic";
import {
  canTriggerPostIntakePipeline,
  getRoomPartiesForPipeline,
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

    const { partyA, partyB } = await getRoomPartiesForPipeline(roomId);
    if (!partyA || !partyB) return;

    await Promise.all([
      runAgentSafely("psychodynamic party A", () =>
        runPsychodynamicAgent({ userId: partyA.id, roomId }),
      ),
      runAgentSafely("psychodynamic party B", () =>
        runPsychodynamicAgent({ userId: partyB.id, roomId }),
      ),
      runAgentSafely("emotional triggers party A", () =>
        runEmotionalTriggersAgent({ userId: partyA.id, roomId }),
      ),
      runAgentSafely("emotional triggers party B", () =>
        runEmotionalTriggersAgent({ userId: partyB.id, roomId }),
      ),
    ]);

    await Promise.all([
      runAgentSafely("interests", () => runInterestsAgent({ roomId })),
      runAgentSafely("legal analysis", () => runLegalAnalysisAgent({ roomId })),
    ]);

    if (await isPostIntakePipelineComplete(roomId)) {
      await markPipelineCompleted(roomId);
      await logPipelineEvent({ roomId, eventType: "pipeline_completed" });

      const { tryPrepareMediationOpening } = await import("@/lib/mediation/prepare-opening");
      tryPrepareMediationOpening(roomId);
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
