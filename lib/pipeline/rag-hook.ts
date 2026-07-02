/**
 * Pipeline integration stub for local legal RAG.
 *
 * When Agent 2 (Precedents) is restored, replace external precedent lookup with:
 *   import { ragSearchForRoomByLegalDomain } from "@/lib/rag";
 *   const results = await ragSearchForRoomByLegalDomain(roomId, searchQueries, legalDomain);
 */
export { ragSearchForRoom, ragSearchForRoomByLegalDomain } from "@/lib/rag";
