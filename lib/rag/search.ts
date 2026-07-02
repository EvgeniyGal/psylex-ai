import { and, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { documentChunks, legalDocuments } from "@/drizzle/schema";
import { RAG_DEFAULTS } from "@/lib/rag/config";
import { embedQuery, formatEmbeddingForPg } from "@/lib/rag/embed";
import type { LegalDocumentCategory, RagSearchResult, RoomJurisdiction, SearchLegalCorpusParams } from "@/lib/rag/types";

type CandidateRow = {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  document_name: string;
  source_url: string;
  category: LegalDocumentCategory;
  vector_score: number;
  bm25_score: number;
};

function normalizeScores(values: number[]) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 1);
  return values.map((value) => (value - min) / (max - min));
}

function buildFilters({
  jurisdiction,
  category,
  documentId,
}: Pick<SearchLegalCorpusParams, "jurisdiction" | "category" | "documentId">) {
  const filters: SQL[] = [sql`ld.jurisdiction = ${jurisdiction}`];
  if (category) filters.push(sql`ld.category = ${category}`);
  if (documentId) filters.push(sql`ld.id = ${documentId}::uuid`);
  return sql.join(filters, sql` AND `);
}

async function fetchCandidates(
  query: string,
  queryEmbedding: number[],
  filters: SQL,
  limit: number,
): Promise<CandidateRow[]> {
  const embeddingLiteral = formatEmbeddingForPg(queryEmbedding);
  const result = await db.execute(sql`
    SELECT
      dc.id AS chunk_id,
      ld.id AS document_id,
      dc.chunk_index,
      dc.content,
      ld.name AS document_name,
      ld.source_url,
      ld.category,
      (1 - (dc.embedding <=> ${embeddingLiteral}::vector)) AS vector_score,
      ts_rank(dc.search_vector, plainto_tsquery('simple', ${query})) AS bm25_score
    FROM document_chunks dc
    INNER JOIN legal_documents ld ON ld.id = dc.document_id
    WHERE ${filters}
      AND ld.status = 'ready'
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> ${embeddingLiteral}::vector
    LIMIT ${limit}
  `);

  return result as unknown as CandidateRow[];
}

async function expandAdjacentChunks(results: RagSearchResult[]) {
  if (results.length === 0) return results;

  const expanded: RagSearchResult[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    const neighbors = await db
      .select({
        chunkIndex: documentChunks.chunkIndex,
        content: documentChunks.content,
        documentId: documentChunks.documentId,
      })
      .from(documentChunks)
      .where(
        and(
          eq(documentChunks.documentId, result.documentId),
          sql`${documentChunks.chunkIndex} BETWEEN ${result.chunkIndex - 1} AND ${result.chunkIndex + 1}`,
        ),
      )
      .orderBy(documentChunks.chunkIndex);

    const mergedContent = neighbors.map((row) => row.content).join("\n\n");
    const key = `${result.documentId}:${result.chunkIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    expanded.push({ ...result, content: mergedContent });
  }

  return expanded;
}

export async function searchLegalCorpus(params: SearchLegalCorpusParams): Promise<RagSearchResult[]> {
  const {
    query,
    jurisdiction,
    category,
    documentId,
    topK = 5,
    alpha = RAG_DEFAULTS.hybridAlpha,
  } = params;

  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const filters = buildFilters({ jurisdiction, category, documentId });
  const queryEmbedding = await embedQuery(trimmedQuery);
  const candidateLimit = topK * RAG_DEFAULTS.searchCandidateMultiplier;

  const candidates = await fetchCandidates(trimmedQuery, queryEmbedding, filters, candidateLimit);
  if (candidates.length === 0) return [];

  const vectorScores = normalizeScores(candidates.map((row) => Number(row.vector_score) || 0));
  const bm25Scores = normalizeScores(candidates.map((row) => Number(row.bm25_score) || 0));

  const ranked = candidates
    .map((row, index) => ({
      content: row.content,
      documentId: row.document_id,
      documentName: row.document_name,
      sourceUrl: row.source_url,
      category: row.category,
      chunkIndex: row.chunk_index,
      score: alpha * vectorScores[index] + (1 - alpha) * bm25Scores[index],
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);

  return expandAdjacentChunks(ranked);
}
