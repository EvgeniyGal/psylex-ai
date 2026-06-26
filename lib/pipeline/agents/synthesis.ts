import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { agentPrompts } from "@/drizzle/schema";
import type { Locale } from "@/lib/i18n";
import { parseJsonResponse, runAgentCompletion, unwrapAgentJsonPayload } from "@/lib/pipeline/openai-client";
import { runAgentJsonCompletion } from "@/lib/pipeline/parse-agent-output";
import {
  localizedContentSchema,
  synthesisClarificationOutputSchema,
  synthesisOptionsOutputSchema,
  type LocalizedContent,
  type PipelineContext,
  type ResolutionOption,
} from "@/lib/pipeline/types";

const bilingualOptionsSchema = z.object({
  optionsEn: synthesisOptionsOutputSchema,
  optionsUk: synthesisOptionsOutputSchema,
});

async function getAgentPrompt() {
  const [row] = await db
    .select()
    .from(agentPrompts)
    .where(eq(agentPrompts.agentKey, "synthesis"))
    .limit(1);
  if (!row) throw new Error("Missing agent prompt: synthesis");
  return row.systemPrompt;
}

function formatOptionsText(options: ResolutionOption[]) {
  return options
    .map(
      (opt, i) =>
        `Option ${i + 1}: ${opt.title}\n${opt.summary}\n${opt.terms.map((t) => `• ${t}`).join("\n")}`,
    )
    .join("\n\n");
}

export async function runSynthesisClarification(
  ctx: PipelineContext,
  userId: string,
  priorReplies: { question: string; answer: string }[],
) {
  const systemPrompt = await getAgentPrompt();
  const locale = ctx.locales[userId] ?? "en";
  const profile = ctx.profiles.find((p) => p.userId === userId);
  const situation = ctx.situations.find((s) => s.userId === userId);

  return runAgentJsonCompletion({
    schema: synthesisClarificationOutputSchema,
    systemPrompt,
    userMessage: JSON.stringify(
      {
        mode: "clarification",
        userId,
        profile,
        situation,
        legalDomain: ctx.legalDomain,
        precedents: ctx.precedents,
        compatibility: ctx.compatibility,
        priorReplies,
      },
      null,
      2,
    ),
    targetLocale: locale,
    outputGuide: `Return JSON with keys: needsClarification (boolean), question (string | null), sideComplete (boolean).`,
  });
}

async function generateOptionsRaw(
  ctx: PipelineContext,
  extra: Record<string, unknown>,
  locales: Locale[],
) {
  const systemPrompt = await getAgentPrompt();
  const needBoth = new Set(locales).size > 1;

  return runAgentCompletion({
    systemPrompt,
    userMessage: JSON.stringify(
      {
        ...extra,
        situations: ctx.situations,
        legalDomain: ctx.legalDomain,
        precedents: ctx.precedents,
        compatibility: ctx.compatibility,
        outputLocales: needBoth ? ["en", "uk"] : locales,
      },
      null,
      2,
    ),
    targetLocale: needBoth ? undefined : locales[0],
    jsonMode: true,
  });
}

export async function runSynthesisOptions(
  ctx: PipelineContext,
  locales: Locale[],
): Promise<{ options: ResolutionOption[]; localized: LocalizedContent | null; content: string }> {
  const needBoth = new Set(locales).size > 1;
  const raw = await generateOptionsRaw(ctx, { mode: "generate_options" }, locales);

  if (needBoth) {
    const bilingual = bilingualOptionsSchema.safeParse(
      unwrapAgentJsonPayload(parseJsonResponse(raw)),
    );
    if (bilingual.success) {
      const enText = formatOptionsText(bilingual.data.optionsEn.options);
      const ukText = formatOptionsText(bilingual.data.optionsUk.options);
      return {
        options: bilingual.data.optionsEn.options,
        localized: localizedContentSchema.parse({ en: enText, uk: ukText }),
        content: enText,
      };
    }
  }

  const single = synthesisOptionsOutputSchema.parse(
    unwrapAgentJsonPayload(parseJsonResponse(raw)),
  );
  const text = formatOptionsText(single.options);
  return { options: single.options, localized: null, content: text };
}

export async function runSynthesisRegenerate(
  ctx: PipelineContext & { dialogueHistory: string; rejectionReason: string },
  locales: Locale[],
) {
  const needBoth = new Set(locales).size > 1;
  const raw = await generateOptionsRaw(
    ctx,
    {
      mode: "regenerate",
      rejectionReason: ctx.rejectionReason,
      dialogueHistory: ctx.dialogueHistory,
    },
    locales,
  );

  if (needBoth) {
    const bilingual = bilingualOptionsSchema.safeParse(
      unwrapAgentJsonPayload(parseJsonResponse(raw)),
    );
    if (bilingual.success) {
      const enText = formatOptionsText(bilingual.data.optionsEn.options);
      const ukText = formatOptionsText(bilingual.data.optionsUk.options);
      return {
        options: bilingual.data.optionsEn.options,
        content: enText,
        localized: localizedContentSchema.parse({ en: enText, uk: ukText }),
      };
    }
  }

  const single = synthesisOptionsOutputSchema.parse(
    unwrapAgentJsonPayload(parseJsonResponse(raw)),
  );
  const text = formatOptionsText(single.options);
  return { options: single.options, content: text, localized: null as LocalizedContent | null };
}
