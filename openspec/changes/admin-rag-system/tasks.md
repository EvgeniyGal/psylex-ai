## 1. Dependencies and database foundation

- [x] 1.1 Add npm dependencies: `pdf-parse`, `mammoth`, `openai`; add `@types/pdf-parse` as dev dependency
- [x] 1.2 Add `legal_document_status` and `legal_document_category` enums and `legal_documents` / `document_chunks` tables to `drizzle/schema.ts` with relations (`category` required on documents)
- [x] 1.3 Create migration `0011_legal_rag.sql`: enable pgvector extension, create tables, GIN index on `search_vector`, vector index on `embedding`
- [x] 1.4 Extend `platform_settings` with optional RAG config columns (`ragChunkSize`, `ragChunkOverlap`, `ragHybridAlpha`, `ragEmbeddingModel`) or add `lib/rag/config.ts` with defaults
- [x] 1.5 Run migration against Neon and verify pgvector extension is active

## 2. RAG core library (`lib/rag/`)

- [x] 2.1 Create `lib/rag/types.ts` with `RagSearchResult`, `LegalDocument`, `LegalDocumentCategory`, chunk, and status types
- [x] 2.1a Create `lib/rag/categories.ts` — enum values, `LEGAL_DOCUMENT_CATEGORIES`, bilingual labels, `isLegalDocumentCategory()`, `categoryLabels(locale)`
- [x] 2.1b Create `lib/rag/map-legal-domain.ts` — map Agent 1 `legal_domain` text to `LegalDocumentCategory` (keyword-based; returns undefined if no match)
- [x] 2.2 Create `lib/rag/extract.ts` — text extraction for TXT, PDF (`pdf-parse`), DOCX (`mammoth`) with validation
- [x] 2.3 Create `lib/rag/chunk.ts` — paragraph-aware chunking with configurable size/overlap
- [x] 2.4 Create `lib/rag/embed.ts` — OpenAI embedding client using platform settings API key; batch embed function
- [x] 2.5 Create `lib/rag/ingest.ts` — `processDocument(documentId)`: extract → chunk → embed → insert chunks with tsvector; update document status
- [x] 2.6 Create `lib/rag/search.ts` — hybrid search: vector + BM25 score merge with alpha, jurisdiction filter, optional category filter, optional documentId scope, adjacent chunk expansion
- [x] 2.7 Create `lib/rag/agent-tool.ts` — `searchLegalCorpus()` and `ragSearchForRoom(roomId, queries, category?)` for agent consumption
- [x] 2.8 Create `lib/rag/inquiry.ts` — test inquiry: search + LLM answer with structured citations

## 3. Admin server actions

- [x] 3.1 Create `app/admin/settings/rag-actions.ts` with Zod-validated server actions: `uploadDocument`, `updateDocument`, `deleteDocument`, `reprocessDocument`, `testInquiry`
- [x] 3.2 Implement multipart file upload handling in `uploadDocument` (name, sourceUrl, jurisdiction, category, file buffer)
- [x] 3.3 Add `getDocumentsByJurisdiction()` query helper for settings page data loading (include category in results; support optional category filter)

## 4. Admin RAG UI (Settings tab)

- [x] 4.1 Add `tabRag` and category label keys to `lib/admin-i18n.ts` (en + uk) for all RAG tab strings
- [x] 4.2 Extend `components/admin/settings-content.tsx` — add `"rag"` to tabs array and render RAG tab panel
- [x] 4.3 Update `app/admin/settings/page.tsx` — load legal documents alongside platform settings for RAG tab
- [x] 4.4 Create `components/admin/rag-settings-content.tsx` — two jurisdiction lists (Ukraine / USA) with category badges, optional category filter, status badges, edit/delete actions
- [x] 4.5 Add upload modal/form: document name, source URL, jurisdiction, category select (required), file attachment (TXT/PDF/DOCX)
- [x] 4.6 Add edit modal for document name, source URL, and category
- [x] 4.7 Add delete confirmation dialog with cascade removal
- [x] 4.8 Add test inquiry panel: document selector, optional category filter, question input, cited LLM response display
- [x] 4.9 Wire `useTransition`, loading states, and `sonner` toasts for all RAG mutations

## 5. Admin dashboard spec delta

- [x] 5.1 Verify Settings page shows Credentials, Tests, Prompts, and RAG tabs with correct active state highlighting

## 6. Agent integration (pipeline-ready)

- [x] 6.1 Export `ragSearchForRoom` from `lib/rag` with documented interface for future Agent 2 wiring
- [x] 6.2 Add integration note or stub hook in pipeline precedent search location for when pipeline tables are restored

## 7. Verification

- [ ] 7.1 Upload a TXT, PDF, and DOCX document for each jurisdiction; confirm `ready` status
- [ ] 7.2 Run test inquiry against Ukrainian document; verify cited answer references correct source URL
- [ ] 7.3 Run test inquiry against American document in `contract` category; verify category isolation (no cross-category results when filter applied)
- [ ] 7.4 Delete a document; confirm chunks removed and search returns no results for it
- [ ] 7.5 Confirm non-admin users cannot access Settings RAG tab via `/admin/settings`
- [ ] 7.6 Upload documents in at least two categories per jurisdiction; verify category appears in list and is editable
