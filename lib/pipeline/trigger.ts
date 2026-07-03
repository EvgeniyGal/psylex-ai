import { runPostIntakePipeline } from "@/lib/pipeline/orchestrator";

export function tryRunPostIntakePipeline(roomId: string) {
  void runPostIntakePipeline(roomId).catch((error) => {
    console.error(`Post-intake pipeline failed for room ${roomId}:`, error);
  });
}

/** Awaitable entry point for server actions — survives request lifecycle better than fire-and-forget. */
export async function ensurePostIntakePipeline(roomId: string) {
  await runPostIntakePipeline(roomId);
}
