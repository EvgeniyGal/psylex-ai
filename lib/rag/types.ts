import type { legalDocumentCategory, legalDocumentStatus, roomJurisdiction } from "@/drizzle/schema";
import type { UsaSubJurisdiction } from "@/lib/rag/usa-jurisdictions";

export type LegalDocumentStatus = (typeof legalDocumentStatus.enumValues)[number];
export type LegalDocumentCategory = (typeof legalDocumentCategory.enumValues)[number];
export type RoomJurisdiction = (typeof roomJurisdiction.enumValues)[number];

export type LegalDocumentRow = {
  id: string;
  name: string;
  sourceUrl: string;
  jurisdiction: RoomJurisdiction;
  usaSubJurisdiction: UsaSubJurisdiction | null;
  category: LegalDocumentCategory;
  originalFilename: string;
  mimeType: string;
  status: LegalDocumentStatus;
  errorMessage: string | null;
  uploadedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentChunkRow = {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  pageNumber: number | null;
};

export type RagSearchResult = {
  content: string;
  documentId: string;
  documentName: string;
  sourceUrl: string;
  category: LegalDocumentCategory;
  chunkIndex: number;
  score: number;
};

export type RagCitation = {
  documentName: string;
  sourceUrl: string;
  excerpt: string;
  chunkIndex: number;
};

export type RagInquiryResult = {
  answer: string;
  citations: RagCitation[];
};

export type SearchLegalCorpusParams = {
  query: string;
  jurisdiction: RoomJurisdiction;
  usaSubJurisdiction?: UsaSubJurisdiction;
  category?: LegalDocumentCategory;
  documentId?: string;
  topK?: number;
  alpha?: number;
};
