import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";
import { runAgentJsonCompletion } from "@/lib/pipeline/parse-agent-output";
import {
  compatibilityOutputSchema,
  type CompatibilityOutput,
  type PipelineContext,
} from "@/lib/pipeline/types";

const COMPATIBILITY_OUTPUT_GUIDE = `Return a JSON object with keys:
- frictionPoints (string[])
- commonGround (string[])
- summary (string)`;

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
  return runAgentJsonCompletion({
    schema: compatibilityOutputSchema,
    systemPrompt,
    userMessage: JSON.stringify(
      {
        profiles: ctx.profiles,
        situations: ctx.situations,
      },
      null,
      2,
    ),
    outputGuide: COMPATIBILITY_OUTPUT_GUIDE,
  });
}
