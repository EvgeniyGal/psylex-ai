import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { documentChunks, legalDocuments } from "@/drizzle/schema";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts, formatEmbeddingForPg } from "@/lib/rag/embed";
import { extractTextFromBuffer } from "@/lib/rag/extract";

export async function processDocument(documentId: string) {
  const [document] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, documentId)).limit(1);
  if (!document) throw new Error("Document not found");

  await db
    .update(legalDocuments)
    .set({ status: "processing", errorMessage: null, updatedAt: new Date() })
    .where(eq(legalDocuments.id, documentId));

  try {
    const fileBuffer = Buffer.isBuffer(document.fileData)
      ? document.fileData
      : Buffer.from(document.fileData as unknown as ArrayBuffer);

    const text = await extractTextFromBuffer(fileBuffer, document.originalFilename);
    const chunks = chunkText(text);
    const embeddings = await embedTexts(chunks.map((chunk) => chunk.content));

    await db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const embedding = embeddings[index];
      const embeddingLiteral = formatEmbeddingForPg(embedding);

      await db.execute(sql`
        INSERT INTO document_chunks (
          document_id,
          chunk_index,
          content,
          token_count,
          search_vector,
          embedding
        ) VALUES (
          ${documentId}::uuid,
          ${chunk.chunkIndex},
          ${chunk.content},
          ${chunk.tokenCount},
          to_tsvector('simple', ${chunk.content}),
          ${embeddingLiteral}::vector
        )
      `);
    }

    await db
      .update(legalDocuments)
      .set({ status: "ready", errorMessage: null, updatedAt: new Date() })
      .where(eq(legalDocuments.id, documentId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document processing failed.";
    await db
      .update(legalDocuments)
      .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
      .where(eq(legalDocuments.id, documentId));
    throw error;
  }
}
