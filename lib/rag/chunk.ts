import { RAG_DEFAULTS } from "@/lib/rag/config";

export type TextChunk = {
  content: string;
  chunkIndex: number;
  tokenCount: number;
};

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function hardSplit(text: string, maxChars: number) {
  const parts: string[] = [];
  for (let index = 0; index < text.length; index += maxChars) {
    parts.push(text.slice(index, index + maxChars));
  }
  return parts;
}

export function chunkText(
  text: string,
  chunkSize = RAG_DEFAULTS.chunkSize,
  overlap = RAG_DEFAULTS.chunkOverlap,
): TextChunk[] {
  const maxChars = chunkSize * 4;
  const overlapChars = overlap * 4;
  const paragraphs = splitParagraphs(text);
  const units: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChars) {
      units.push(paragraph);
      continue;
    }
    units.push(...hardSplit(paragraph, maxChars));
  }

  if (units.length === 0) {
    return [{ content: text.trim(), chunkIndex: 0, tokenCount: estimateTokens(text) }];
  }

  const chunks: TextChunk[] = [];
  let current = "";

  for (const unit of units) {
    const candidate = current ? `${current}\n\n${unit}` : unit;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push({
        content: current,
        chunkIndex: chunks.length,
        tokenCount: estimateTokens(current),
      });
      const tail = current.slice(Math.max(0, current.length - overlapChars));
      current = tail ? `${tail}\n\n${unit}` : unit;
      if (current.length > maxChars) {
        const splitParts = hardSplit(current, maxChars);
        for (const part of splitParts.slice(0, -1)) {
          chunks.push({
            content: part,
            chunkIndex: chunks.length,
            tokenCount: estimateTokens(part),
          });
        }
        current = splitParts.at(-1) ?? "";
      }
      continue;
    }

    const splitParts = hardSplit(unit, maxChars);
    for (const part of splitParts.slice(0, -1)) {
      chunks.push({
        content: part,
        chunkIndex: chunks.length,
        tokenCount: estimateTokens(part),
      });
    }
    current = splitParts.at(-1) ?? "";
  }

  if (current.trim()) {
    chunks.push({
      content: current.trim(),
      chunkIndex: chunks.length,
      tokenCount: estimateTokens(current),
    });
  }

  return chunks;
}
