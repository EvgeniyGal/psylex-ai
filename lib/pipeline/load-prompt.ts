import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";
import type { AgentKey } from "@/lib/pipeline/agent-keys";

export async function loadAgentPrompt(agentKey: AgentKey, draftOverride?: string) {
  if (draftOverride !== undefined) {
    return draftOverride;
  }

  const [row] = await db
    .select({ systemPrompt: agentPrompts.systemPrompt })
    .from(agentPrompts)
    .where(eq(agentPrompts.agentKey, agentKey))
    .limit(1);

  if (!row?.systemPrompt) {
    throw new Error(`No system prompt configured for agent "${agentKey}".`);
  }

  return row.systemPrompt;
}

export async function getAllAgentPrompts() {
  const rows = await db
    .select({
      agentKey: agentPrompts.agentKey,
      systemPrompt: agentPrompts.systemPrompt,
      updatedAt: agentPrompts.updatedAt,
    })
    .from(agentPrompts);

  return rows;
}

export async function saveAgentPrompt(agentKey: AgentKey, systemPrompt: string) {
  const [existing] = await db
    .select({ id: agentPrompts.id })
    .from(agentPrompts)
    .where(eq(agentPrompts.agentKey, agentKey))
    .limit(1);

  if (existing) {
    await db
      .update(agentPrompts)
      .set({ systemPrompt, updatedAt: new Date() })
      .where(eq(agentPrompts.agentKey, agentKey));
    return;
  }

  await db.insert(agentPrompts).values({ agentKey, systemPrompt });
}
