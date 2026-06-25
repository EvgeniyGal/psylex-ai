import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";

export async function getAgentPrompts() {
  const rows = await db.select().from(agentPrompts);
  const map = Object.fromEntries(rows.map((r) => [r.agentKey, r.systemPrompt]));
  return {
    legal_domain: map.legal_domain ?? "",
    precedents: map.precedents ?? "",
    compatibility: map.compatibility ?? "",
    synthesis: map.synthesis ?? "",
  };
}

export async function getAgentPrompt(agentKey: string) {
  const [row] = await db
    .select()
    .from(agentPrompts)
    .where(eq(agentPrompts.agentKey, agentKey))
    .limit(1);
  return row?.systemPrompt ?? "";
}
