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
      runPsychodynamicAgent({ userId: side1.id, roomId }),
      runPsychodynamicAgent({ userId: side2.id, roomId }),
      runEmotionalTriggersAgent({ userId: side1.id, roomId }),
      runEmotionalTriggersAgent({ userId: side2.id, roomId }),
    ]);

    await Promise.all([
      runInterestsAgent({ roomId }),
      runLegalAnalysisAgent({ roomId }),
    ]);

    if (await isPostIntakePipelineComplete(roomId)) {
      await markPipelineCompleted(roomId);
      await logPipelineEvent({ roomId, eventType: "pipeline_completed" });
    }
  } finally {
    runningRooms.delete(roomId);
  }
}
