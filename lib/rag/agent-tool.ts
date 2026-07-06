import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import { mapLegalDomainToCategory } from "@/lib/rag/map-legal-domain";
import { searchLegalCorpusWithFallback } from "@/lib/rag/search";
import type { LegalDocumentCategory, RagSearchResult } from "@/lib/rag/types";
import { parseUsaSubJurisdiction } from "@/lib/rag/usa-jurisdictions";

export async function ragSearchForRoom(
  roomId: string,
  queries: string[],
  category?: LegalDocumentCategory,
): Promise<RagSearchResult[]> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return [];

  const usaSubJurisdiction = parseUsaSubJurisdiction(room.usaSubJurisdiction);
  const deduped = new Map<string, RagSearchResult>();

  for (const query of queries) {
    const results = await searchLegalCorpusWithFallback([query], {
      jurisdiction: room.jurisdiction,
      usaSubJurisdiction: usaSubJurisdiction ?? undefined,
      category,
      topK: 5,
    });

    for (const result of results) {
      const key = `${result.documentId}:${result.chunkIndex}`;
      const existing = deduped.get(key);
      if (!existing || result.score > existing.score) {
        deduped.set(key, result);
      }
    }
  }

  return [...deduped.values()].sort((left, right) => right.score - left.score);
}

export async function ragSearchForRoomByLegalDomain(
  roomId: string,
  queries: string[],
  legalDomain?: string,
): Promise<RagSearchResult[]> {
  const category = legalDomain ? mapLegalDomainToCategory(legalDomain) : undefined;
  return ragSearchForRoom(roomId, queries, category);
}

export { searchLegalCorpus, searchLegalCorpusMulti, searchLegalCorpusWithFallback } from "@/lib/rag/search";
export { mapLegalDomainToCategory } from "@/lib/rag/map-legal-domain";
