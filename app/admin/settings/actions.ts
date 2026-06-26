"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { platformSettings, agentPrompts } from "@/drizzle/schema";
import { getPlatformSettings } from "@/lib/platform-settings";
import type { AgentKey } from "@/drizzle/schema";
import { runAgentCompletion } from "@/lib/pipeline/openai-client";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

function optionalString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function saveApiCredentials(formData: FormData) {
  await requireAdmin();

  const openaiApiKey = optionalString(formData.get("openaiApiKey"));
  const airtableApiKey = optionalString(formData.get("airtableApiKey"));
  const legalDataHunterApiKey = optionalString(formData.get("legalDataHunterApiKey"));

  await getPlatformSettings();

  await db
    .update(platformSettings)
    .set({
      openaiApiKey,
      airtableApiKey,
      legalDataHunterApiKey,
      updatedAt: new Date(),
    })
    .where(eq(platformSettings.id, "default"));

  revalidatePath("/admin/settings");
}

export async function saveTestLinks(formData: FormData) {
  await requireAdmin();

  const testPersonalityTypeUrl = optionalString(formData.get("testPersonalityTypeUrl"));
  const testFaceFearUrl = optionalString(formData.get("testFaceFearUrl"));
  const testCharacterTraitsUrl = optionalString(formData.get("testCharacterTraitsUrl"));
  const testPersonalityConflictsUrl = optionalString(formData.get("testPersonalityConflictsUrl"));

  await getPlatformSettings();

  await db
    .update(platformSettings)
    .set({
      testPersonalityTypeUrl,
      testFaceFearUrl,
      testCharacterTraitsUrl,
      testPersonalityConflictsUrl,
      updatedAt: new Date(),
    })
    .where(eq(platformSettings.id, "default"));

  revalidatePath("/admin/settings");
}

function requiredString(value: FormDataEntryValue | null, field: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${field} is required`);
  return text;
}

export async function saveAgentPrompt(formData: FormData) {
  await requireAdmin();
  const agentKey = String(formData.get("agentKey")) as AgentKey;
  const systemPrompt = requiredString(formData.get("systemPrompt"), "systemPrompt");

  await db
    .insert(agentPrompts)
    .values({ agentKey, systemPrompt, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: agentPrompts.agentKey,
      set: { systemPrompt, updatedAt: new Date() },
    });

  revalidatePath("/admin/settings");
}

export async function testAgentPrompt(formData: FormData) {
  await requireAdmin();
  const systemPrompt = requiredString(formData.get("systemPrompt"), "systemPrompt");
  const sampleInput = String(formData.get("sampleInput") ?? "").trim() || "{}";

  return runAgentCompletion({
    systemPrompt,
    userMessage: sampleInput,
    jsonMode: true,
  });
}
