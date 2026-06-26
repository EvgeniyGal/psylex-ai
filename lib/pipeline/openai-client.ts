import { getPlatformSettings } from "@/lib/platform-settings";
import type { Locale } from "@/lib/i18n";
import type { AgentRunOptions } from "@/lib/pipeline/types";

function localeInstruction(locale: Locale) {
  return locale === "uk"
    ? "Respond entirely in Ukrainian."
    : "Respond entirely in English.";
}

export async function runAgentCompletion({
  systemPrompt,
  userMessage,
  targetLocale,
  jsonMode = true,
}: Omit<AgentRunOptions, "agentKey">): Promise<string> {
  const settings = await getPlatformSettings();
  const apiKey = settings.openaiApiKey.trim();
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured in admin settings.");
  }

  const systemParts = [systemPrompt];
  if (targetLocale) {
    systemParts.push(localeInstruction(targetLocale));
  }
  if (jsonMode) {
    systemParts.push("Return valid JSON only, no markdown fences.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: jsonMode ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: systemParts.join("\n\n") },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI returned empty content.");
  return content;
}

export function parseJsonResponse<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : trimmed;
  return JSON.parse(jsonText) as T;
}

const AGENT_JSON_WRAPPER_KEYS = ["result", "response", "output", "data", "analysis"] as const;

/** Unwrap common LLM nesting and map snake_case keys to camelCase. */
export function unwrapAgentJsonPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;

  const obj = { ...(raw as Record<string, unknown>) };

  const aliasMap: Record<string, string> = {
    legal_domain: "legalDomain",
    applicable_norms: "applicableNorms",
    needs_jurisdiction_clarification: "needsJurisdictionClarification",
    jurisdiction_question: "jurisdictionQuestion",
    side_clarifications: "sideClarifications",
    friction_points: "frictionPoints",
    common_ground: "commonGround",
    needs_clarification: "needsClarification",
    side_complete: "sideComplete",
  };

  for (const [from, to] of Object.entries(aliasMap)) {
    if (from in obj && obj[to] === undefined) {
      obj[to] = obj[from];
    }
  }

  for (const key of AGENT_JSON_WRAPPER_KEYS) {
    const nested = obj[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return unwrapAgentJsonPayload(nested);
    }
  }

  return obj;
}
