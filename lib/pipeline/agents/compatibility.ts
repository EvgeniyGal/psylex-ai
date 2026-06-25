import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";
import { parseJsonResponse, runAgentCompletion } from "@/lib/pipeline/openai-client";
import {
  compatibilityOutputSchema,
  type CompatibilityOutput,
  type PipelineContext,
} from "@/lib/pipeline/types";

async function getAgentPrompt() {
  const [row] = await db
    .select()
    .from(agentPrompts)
    .where(eq(agentPrompts.agentKey, "compatibility"))
    .limit(1);
  if (!row) throw new Error("Missing agent prompt: compatibility");
  return row.systemPrompt;
}

export async function runCompatibilityAgent(ctx: PipelineContext): Promise<CompatibilityOutput> {
  const systemPrompt = await getAgentPrompt();
  const raw = await runAgentCompletion({
    systemPrompt,
    userMessage: JSON.stringify(
      {
        profiles: ctx.profiles,
        situations: ctx.situations,
      },
      null,
      2,
    ),
    jsonMode: true,
  });
  return compatibilityOutputSchema.parse(parseJsonResponse(raw));
}
