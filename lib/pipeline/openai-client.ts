import OpenAI from "openai";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function getOpenAIClient() {
  const settings = await getPlatformSettings();
  if (!settings.openaiApiKey) {
    throw new Error("OpenAI API key is not configured in Settings → Credentials.");
  }
  return new OpenAI({ apiKey: settings.openaiApiKey });
}

export function parseJsonFromModelResponse(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
}
