"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { runEmotionalTriggersAgent } from "@/lib/pipeline/agents/emotional-triggers";
import { runInterestsAgent } from "@/lib/pipeline/agents/interests";
import { runLegalAnalysisAgent } from "@/lib/pipeline/agents/legal-analysis";
import { runPsychodynamicAgent } from "@/lib/pipeline/agents/psychodynamic";
import {
  getEligibleTestRooms,
  getEligibleTestUsers,
  getMediationTestRooms,
  getRoomTestInputPreview,
  getUserTestInputPreview,
} from "@/lib/pipeline/admin-queries";
import { AGENT_KEYS, type AgentKey } from "@/lib/pipeline/agent-keys";
import { normalizeLocale } from "@/lib/pipeline/locale";
import { saveAgentPrompt as persistAgentPrompt } from "@/lib/pipeline/load-prompt";
import type { Locale } from "@/lib/i18n";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

const agentKeySchema = z.enum(AGENT_KEYS);

function parseTargetLocale(value: FormDataEntryValue | null): Locale {
  return normalizeLocale(String(value ?? "en"));
}

export async function saveAgentPromptAction(formData: FormData) {
  await requireAdmin();

  const agentKey = agentKeySchema.parse(formData.get("agentKey"));
  const systemPrompt = String(formData.get("systemPrompt") ?? "").trim();
  if (!systemPrompt) throw new Error("System prompt is required.");

  await persistAgentPrompt(agentKey, systemPrompt);
  revalidatePath("/admin/settings");
}

export async function loadAgentTestOptions(agentKey: AgentKey) {
  await requireAdmin();

  if (agentKey === "psychodynamic" || agentKey === "emotional_triggers") {
    return {
      type: "user" as const,
      options: await getEligibleTestUsers(agentKey),
    };
  }

  if (agentKey === "mediation") {
    return {
      type: "room" as const,
      options: await getMediationTestRooms(),
    };
  }

  return {
    type: "room" as const,
    options: await getEligibleTestRooms(),
  };
}

export async function loadAgentTestPreview(params: {
  agentKey: AgentKey;
  userId?: string;
  roomId?: string;
}) {
  await requireAdmin();
  const agentKey = agentKeySchema.parse(params.agentKey);

  if (agentKey === "psychodynamic" || agentKey === "emotional_triggers") {
    if (!params.userId) return null;
    return getUserTestInputPreview(params.userId);
  }

  if (!params.roomId) return null;
  return getRoomTestInputPreview(params.roomId);
}

export async function testAgentPromptAction(formData: FormData) {
  await requireAdmin();

  const agentKey = agentKeySchema.parse(formData.get("agentKey"));
  const draftPrompt = String(formData.get("systemPrompt") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const roomId = String(formData.get("roomId") ?? "").trim();
  const targetLocale = parseTargetLocale(formData.get("targetLocale"));

  if (!draftPrompt) throw new Error("System prompt is required.");

  if (agentKey === "psychodynamic") {
    if (!userId) throw new Error("Select a participant.");
    const [userRow] = await db
      .select({ roomId: users.roomId, preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return runPsychodynamicAgent({
      userId,
      roomId: userRow?.roomId ?? undefined,
      draftPrompt,
      dryRun: true,
    });
  }

  if (agentKey === "emotional_triggers") {
    if (!userId) throw new Error("Select a participant.");
    const [userRow] = await db
      .select({ roomId: users.roomId, preferredLocale: users.preferredLocale })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return runEmotionalTriggersAgent({
      userId,
      roomId: userRow?.roomId ?? undefined,
      draftPrompt,
      dryRun: true,
    });
  }

  if (agentKey === "interests") {
    if (!roomId) throw new Error("Select a room.");
    return runInterestsAgent({ roomId, draftPrompt, dryRun: true, targetLocale });
  }

  if (agentKey === "mediation") {
    if (!roomId) throw new Error("Select a room.");
    const { buildMediationTestContext } = await import("@/lib/mediation/orchestrator");
    const { runMediationSimulation } = await import("@/lib/mediation/run-agent");
    const { context } = await buildMediationTestContext(roomId);
    return runMediationSimulation({ context, draftPrompt });
  }

  if (!roomId) throw new Error("Select a room.");
  return runLegalAnalysisAgent({ roomId, draftPrompt, dryRun: true, targetLocale });
}
