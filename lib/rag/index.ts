/**
 * Legal RAG module — hybrid search (BM25 + embeddings) over admin-managed documents.
 *
 * Agent integration: call `ragSearchForRoom(roomId, queries, category?)` from Agent 2
 * once the dispute pipeline is restored.
 */
export { ragSearchForRoom, ragSearchForRoomByLegalDomain, searchLegalCorpus } from "@/lib/rag/agent-tool";
export { mapLegalDomainToCategory } from "@/lib/rag/map-legal-domain";
export { runRagInquiry } from "@/lib/rag/inquiry";
export { prepareLegalSearch } from "@/lib/rag/prepare-search";
export { processDocument } from "@/lib/rag/ingest";
export { getAllLegalDocuments, getDocumentsByJurisdiction } from "@/lib/rag/documents";
export { LEGAL_DOCUMENT_CATEGORIES, categoryLabels, getCategoryLabel, isLegalDocumentCategory } from "@/lib/rag/categories";
export type {
  LegalDocumentCategory,
  LegalDocumentRow,
  LegalDocumentStatus,
  RagCitation,
  RagInquiryResult,
  RagSearchResult,
  RoomJurisdiction,
} from "@/lib/rag/types";
