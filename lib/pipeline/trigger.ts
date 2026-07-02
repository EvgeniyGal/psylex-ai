import { runPostIntakePipeline } from "@/lib/pipeline/orchestrator";

export function tryRunPostIntakePipeline(roomId: string) {
  void runPostIntakePipeline(roomId).catch((error) => {
    console.error(`Post-intake pipeline failed for room ${roomId}:`, error);
  });
}
