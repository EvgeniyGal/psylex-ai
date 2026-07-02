## Context

PsyLex is a Next.js 16 admin + mediation app using Drizzle ORM on Neon PostgreSQL. Rooms have a persisted `jurisdiction` enum (`ukraine` | `usa`) set at creation. The admin dashboard uses a sidebar with Rooms, Mediators, and Settings. There is no local RAG, document upload, or vector search today. OpenAI is used via raw `fetch` for chat completions; platform API keys live in the `platform_settings` singleton.

The user described a legal-agent retrieval flow: extract issues → generate search queries → hybrid RAG (BM25 + embeddings) → rerank → return complete articles → LLM analysis with citations. This change implements the storage, ingestion, search, and admin management layers; agent orchestration will consume search as a tool filtered by room jurisdiction.

## Goals / Non-Goals

**Goals:**

- Store legal documents and searchable chunks in the existing PostgreSQL database (Neon).
- Admin RAG tab within Settings with Ukrainian and American document lists, upload (TXT/PDF/DOCX), edit, delete, and processing status.
- Hybrid retrieval: PostgreSQL `tsvector` (BM25-style) + pgvector embeddings with configurable alpha blending and reranking.
- Jurisdiction-scoped search using the existing `room_jurisdiction` enum.
- Legal category on every document (eight fixed categories); category used to scope RAG search in agent and test-inquiry flows.
- Admin test inquiry: query a document/corpus and get an LLM answer with citations.
- Agent-facing `searchLegalCorpus()` tool API for future pipeline integration.
- Bilingual admin UI (en/uk) following `admin-i18n.ts` patterns.

**Non-Goals:**

- Replacing or rebuilding the full dispute AI pipeline in this change (pipeline tables were removed; wiring is spec'd for when pipeline returns).
- External Legal Data Hunter integration (may remain optional fallback later).
- OCR for scanned PDFs, image-based documents, or non-text PDFs.
- Real-time collaborative editing of documents.
- Mediator-level access to RAG management (admin-only).

## Decisions

### 1. PostgreSQL-native hybrid search (pgvector + tsvector)

**Choice:** Store embeddings in pgvector and full-text indexes in `tsvector` on the same `document_chunks` table; merge scores in application code.

**Rationale:** Reuses the existing Neon Postgres stack—no separate vector DB (Pinecone, Qdrant). Drizzle supports custom SQL for vector ops; Neon supports pgvector.

**Alternatives considered:**
- *Dedicated vector DB* — simpler scaling but adds infra and sync complexity; rejected for MVP.
- *BM25-only (no embeddings)* — insufficient semantic recall for legal paraphrasing; rejected.

**Alpha default:** `0.7` vector / `0.3` BM25 (consistent with prior Legal Data Hunter integration pattern in project history).

### 2. Schema design

```
legal_document_category enum:
  labor | family | contract | property | consumer | corporate | insurance | odr_international

legal_documents
  id, name, source_url, jurisdiction (room_jurisdiction enum),
  category (legal_document_category enum),
  original_filename, mime_type, file_data (bytea) OR storage_path,
  status (pending|processing|ready|failed), error_message,
  uploaded_by_user_id, created_at, updated_at

document_chunks
  id, document_id (FK cascade), chunk_index, content, token_count,
  page_number (nullable), metadata (jsonb),
  search_vector (tsvector), embedding (vector(1536))
```

**Category labels** (for admin UI, bilingual via `lib/rag/categories.ts`):

| Enum | RU | EN |
|------|----|----|
| `labor` | Трудовой | Labor |
| `family` | Семейный | Family |
| `contract` | Договорной | Contract |
| `property` | Имущественный | Property |
| `consumer` | Потребительский | Consumer |
| `corporate` | Корпоративный | Corporate |
| `insurance` | Страховой | Insurance |
| `odr_international` | ODR / Международный | ODR / International |

**Rationale:** Category is stored on the document (not chunk) since entire documents belong to one legal domain. Follows the same pattern as `lib/room/jurisdiction.ts` for labels and validation helpers.

**Embedding model:** OpenAI `text-embedding-3-small` (1536 dimensions) via platform OpenAI key.

### 3. Document parsing libraries

| Format | Library | Rationale |
|--------|---------|-----------|
| TXT | Native Node `TextDecoder` | No dependency |
| PDF | `pdf-parse` | Lightweight, widely used, good for text PDFs |
| DOCX | `mammoth` | Extracts clean paragraph text |

Add `@types/pdf-parse` as dev dependency. Validate MIME type and extension on upload.

### 4. Chunking strategy

- Chunk size: **800 tokens** (approx 3200 chars), overlap **100 tokens**.
- Split on paragraph boundaries where possible, then hard-split long paragraphs.
- Store `chunk_index` for ordering; expansion retrieves adjacent chunks (±1) when a hit is mid-article.

**Rationale:** 800 tokens balances context window cost and retrieval precision for legal articles.

### 5. Ingestion flow

```
Admin upload (server action, multipart FormData)
  → validate + insert legal_documents (status: pending)
  → trigger processDocument(documentId) [inline or background]
      → extract text
      → chunk
      → batch embed (OpenAI, batches of 20)
      → insert chunks with tsvector + embedding
      → status: ready | failed
```

**Choice:** Process synchronously in the server action for MVP with a loading state; move to a job queue if uploads are slow.

**Retry:** Admin can click "Reprocess" on failed documents.

### 6. Hybrid search algorithm

```typescript
// lib/rag/search.ts
searchLegalCorpus({ query, jurisdiction, category?, topK, documentId?, alpha })
```

1. Embed query via OpenAI.
2. SQL: filter `legal_documents.jurisdiction = $jurisdiction` and optionally `legal_documents.category = $category` (and optional `document_id`).
3. Fetch top `topK * 3` candidates by vector cosine distance.
4. Compute `ts_rank(search_vector, plainto_tsquery(query))` for same candidates.
5. Normalize both score arrays to [0,1].
6. `combined = alpha * vectorScore + (1 - alpha) * bm25Score`.
7. Rerank top candidates (optional cross-encoder later; MVP uses score sort).
8. Expand adjacent chunks for complete article context.
9. Return `{ content, documentName, sourceUrl, category, chunkIndex, score }[]`.

**Language config:** Use `'simple'` text search config for both jurisdictions initially; add `'ukrainian'` config if Ukrainian stemming quality is insufficient.

### 7. Admin UI structure

**Route:** `/admin/settings` — RAG is a fourth horizontal tab in `settings-content.tsx` alongside Credentials, Tests, and Prompts (`tabRag` label in `admin-i18n.ts`).

**Integration pattern:**
- Extend `settings-content.tsx` tabs array: `["credentials", "tests", "prompts", "rag"]`
- Extract RAG UI into `components/admin/rag-settings-content.tsx` (keeps settings page maintainable)
- Server page `app/admin/settings/page.tsx` loads platform settings + legal documents for the RAG tab
- Server actions in `app/admin/settings/rag-actions.ts` (or co-located in existing actions file)

**Layout (`rag-settings-content.tsx`):**
- Page header area inherited from Settings shell (shared title/subtitle or RAG-specific subtitle within tab)
- Two-column or stacked sections: **Ukraine** | **USA** document tables
- Each row: name (link to source URL), **category badge**, status badge, date, edit/delete actions
- Optional category filter dropdown within each jurisdiction section
- Upload modal: name, URL, jurisdiction radio, **category select** (required), file input
- Bottom/side panel: **Test inquiry** — document selector, optional category filter, question textarea, submit, response with citations

**Patterns:** Same horizontal tab bar and `glass-card` container as existing Settings tabs; mutations via server actions + `useTransition` + `sonner`.

### 8. Test inquiry LLM flow

```
Admin question + optional documentId
  → searchLegalCorpus (scoped)
  → build prompt with retrieved chunks as context
  → OpenAI chat completion (gpt-4o-mini)
  → return { answer, citations[] }
```

Citations include document name, source URL, and excerpt. No agent framework needed for admin test — a single server action with structured prompt is sufficient.

### 9. Agent tool API

```typescript
// lib/rag/agent-tool.ts
export async function ragSearchForRoom(
  roomId: string,
  queries: string[],
  category?: LegalDocumentCategory,
): Promise<RagSearchResult[]>
```

- Loads `rooms.jurisdiction` by `roomId`.
- Runs hybrid search per query with jurisdiction + optional category filter, deduplicates, returns top results.
- `lib/rag/map-legal-domain.ts` maps Agent 1 `legal_domain` free text → `LegalDocumentCategory` enum (fuzzy keyword match; fallback to unscoped search).
- Future Agent 2 calls this instead of/in addition to external APIs.

### 10. Platform settings extension

Add to `platform_settings`:
- `ragChunkSize` (default 800)
- `ragChunkOverlap` (default 100)
- `ragHybridAlpha` (default 0.7)
- `ragEmbeddingModel` (default `text-embedding-3-small`)

Optional: expose in Settings → Credentials tab or a RAG config subsection later. MVP can use hardcoded defaults with DB columns for future UI.

### 11. New dependencies

```json
{
  "pdf-parse": "^1.1.1",
  "mammoth": "^1.8.0",
  "openai": "^4.x"
}
```

**Rationale:** `openai` SDK simplifies embeddings batching and chat for test inquiry vs raw fetch. pgvector operations use raw SQL via Drizzle `sql` template.

### 12. Migration

- `CREATE EXTENSION IF NOT EXISTS vector;`
- New enums: `legal_document_status`, `legal_document_category`
- New tables: `legal_documents`, `document_chunks`
- GIN index on `search_vector`, IVFFlat or HNSW index on `embedding`

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Neon pgvector not enabled | Verify extension support before migration; document enablement step |
| Large PDFs slow ingestion | Show processing status; set upload size limit (e.g. 10 MB); async processing later |
| Scanned PDFs yield no text | Validate extracted text length; fail with clear error |
| Ukrainian FTS quality with `simple` config | Monitor recall; switch to `ukrainian` config if available |
| `bytea` storage grows DB size | Acceptable for MVP legal corpus; migrate to blob storage if needed |
| Pipeline code removed | Ship RAG tool API independently; wire Agent 2 when pipeline is restored |
| Embedding API cost | Batch requests; cache query embeddings within a single search call |

## Migration Plan

1. Enable pgvector on Neon (manual console step if needed).
2. Run Drizzle migration `0011_legal_rag.sql`.
3. Deploy backend `lib/rag/` module.
4. Deploy admin UI RAG tab within `/admin/settings`.
5. Admin uploads initial Ukrainian and American legal documents.
6. Verify test inquiry returns cited answers.
7. When pipeline is restored, connect `ragSearchForRoom` in Agent 2.

**Rollback:** Drop new tables; remove RAG tab from Settings; no changes to existing room/user tables.

## Open Questions

- **File size limit:** 10 MB default — confirm with stakeholders.
- **Storage:** `bytea` in Postgres vs filesystem — start with `bytea`; revisit if corpus grows large.
- **Reprocess on edit:** Changing name/URL does not re-index; only file replacement should trigger reprocessing (if file edit is added later).
- **Cross-encoder reranker:** Deferred; score-based rerank sufficient for MVP.
