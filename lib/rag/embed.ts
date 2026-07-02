import OpenAI from "openai";
import { getPlatformSettings } from "@/lib/platform-settings";
import { RAG_DEFAULTS } from "@/lib/rag/config";

async function getClient() {
  const settings = await getPlatformSettings();
  if (!settings.openaiApiKey) {
    throw new Error("OpenAI API key is not configured in Settings → Credentials.");
  }
  return new OpenAI({ apiKey: settings.openaiApiKey });
}

export async function embedTexts(texts: string[], model = RAG_DEFAULTS.embeddingModel): Promise<number[][]> {
  if (texts.length === 0) return [];
  const client = await getClient();
  const response = await client.embeddings.create({ model, input: texts });
  return response.data
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);
}

export async function embedQuery(query: string, model = RAG_DEFAULTS.embeddingModel): Promise<number[]> {
  const [embedding] = await embedTexts([query], model);
  return embedding;
}

export function formatEmbeddingForPg(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}
