import { RAG_DEFAULTS } from "@/lib/rag/config";

const SUPPORTED_EXTENSIONS = [".txt", ".pdf", ".docx"] as const;

const MIME_BY_EXTENSION: Record<(typeof SUPPORTED_EXTENSIONS)[number], string> = {
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export class DocumentExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentExtractError";
  }
}

export function getExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index === -1 ? "" : filename.slice(index).toLowerCase();
}

export function validateUploadFile(filename: string, size: number) {
  const extension = getExtension(filename);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new DocumentExtractError("Unsupported file format. Use TXT, PDF, or DOCX.");
  }
  if (size <= 0) {
    throw new DocumentExtractError("File is empty.");
  }
  if (size > RAG_DEFAULTS.maxUploadBytes) {
    throw new DocumentExtractError("File exceeds the 10 MB upload limit.");
  }
  return {
    extension: extension as (typeof SUPPORTED_EXTENSIONS)[number],
    mimeType: MIME_BY_EXTENSION[extension as (typeof SUPPORTED_EXTENSIONS)[number]],
  };
}

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  return text.trim();
}

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const { extension } = validateUploadFile(filename, buffer.length);

  if (extension === ".txt") {
    const text = buffer.toString("utf8").trim();
    if (!text) throw new DocumentExtractError("TXT file contains no readable text.");
    return text;
  }

  if (extension === ".pdf") {
    const text = await extractTextFromPdfBuffer(buffer);
    if (!text) throw new DocumentExtractError("PDF contains no extractable text.");
    return text;
  }

  const mammoth = await import("mammoth");
  const parsed = await mammoth.extractRawText({ buffer });
  const text = parsed.value?.trim() ?? "";
  if (!text) throw new DocumentExtractError("DOCX contains no extractable text.");
  return text;
}
