import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";
import { parseJsonResponse, runAgentCompletion } from "@/lib/pipeline/openai-client";
import { enrichPrecedentsPrompt, searchPrecedents } from "@/lib/pipeline/precedent-search";
import {
  precedentsOutputSchema,
  type PipelineContext,
  type PrecedentsOutput,
} from "@/lib/pipeline/types";

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
  const raw = await runAgentCompletion({
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
    jsonMode: true,
  });
  return precedentsOutputSchema.parse(parseJsonResponse(raw));
}
