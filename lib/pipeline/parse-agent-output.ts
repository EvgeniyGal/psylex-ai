import type { z } from "zod";
import type { Locale } from "@/lib/i18n";
import {
  parseJsonResponse,
  runAgentCompletion,
  unwrapAgentJsonPayload,
} from "@/lib/pipeline/openai-client";

export function parseAgentOutput<T>(schema: z.ZodType<T>, raw: string) {
  return schema.safeParse(unwrapAgentJsonPayload(parseJsonResponse(raw)));
}

export async function runAgentJsonCompletion<T>(params: {
  schema: z.ZodType<T>;
  systemPrompt: string;
  userMessage: string;
  outputGuide?: string;
  targetLocale?: Locale;
  normalize?: (value: unknown) => unknown;
}): Promise<T> {
  const userMessage = params.outputGuide
    ? `${params.userMessage}\n\n${params.outputGuide}`
    : params.userMessage;

  async function attempt(message: string) {
    const raw = await runAgentCompletion({
      systemPrompt: params.systemPrompt,
      userMessage: message,
      targetLocale: params.targetLocale,
      jsonMode: true,
    });
    const parsed = parseJsonResponse(raw);
    const normalized = params.normalize
      ? params.normalize(parsed)
      : unwrapAgentJsonPayload(parsed);
    return params.schema.safeParse(normalized);
  }

  let result = await attempt(userMessage);
  if (!result.success) {
    result = await attempt(
      `${userMessage}\n\nYour previous JSON failed validation (${result.error.message}). Return only the corrected JSON object.`,
    );
  }

  if (!result.success) {
    throw result.error;
  }

  return result.data;
}
