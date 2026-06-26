import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";
import { runAgentJsonCompletion } from "@/lib/pipeline/parse-agent-output";
import { enrichPrecedentsPrompt, searchPrecedents } from "@/lib/pipeline/precedent-search";
import {
  precedentsOutputSchema,
  type PipelineContext,
  type PrecedentsOutput,
} from "@/lib/pipeline/types";

const PRECEDENTS_OUTPUT_GUIDE = `Return a JSON object with key "precedents" (array of { title, summary, relevance }).`;

async function getAgentPrompt() {
  const [row] = await db
    .select()
    .from(agentPrompts)
    .where(eq(agentPrompts.agentKey, "precedents"))
    .limit(1);
  if (!row) throw new Error("Missing agent prompt: precedents");
  return row.systemPrompt;
}

export async function runPrecedentsAgent(ctx: PipelineContext): Promise<PrecedentsOutput> {
  if (!ctx.legalDomain?.legalDomain) {
    throw new Error("Legal domain output required before precedents agent.");
  }

  const summary = ctx.situations.map((s) => s.whatHappened).join("\n");
  const stub = await searchPrecedents(
    ctx.legalDomain.legalDomain,
    ctx.legalDomain.jurisdiction,
    summary,
  );

  const systemPrompt = await getAgentPrompt();
  return runAgentJsonCompletion({
    schema: precedentsOutputSchema,
    systemPrompt,
    userMessage: JSON.stringify(
      {
        legalDomain: ctx.legalDomain,
        situations: ctx.situations,
        externalResearch: enrichPrecedentsPrompt(stub),
      },
      null,
      2,
    ),
    outputGuide: PRECEDENTS_OUTPUT_GUIDE,
  });
}
