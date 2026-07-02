export const RAG_DEFAULTS = {
  chunkSize: 800,
  chunkOverlap: 100,
  hybridAlpha: 0.7,
  embeddingModel: "text-embedding-3-small",
  embeddingDimensions: 1536,
  searchCandidateMultiplier: 3,
  maxUploadBytes: 10 * 1024 * 1024,
  /** Minimum hybrid search score (0–1) to treat a chunk as relevant for inquiry. */
  minInquiryScore: 0.25,
} as const;

export const RAG_INQUIRY_NOT_FOUND = "NOT_FOUND" as const;
