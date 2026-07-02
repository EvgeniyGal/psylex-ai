## Why

The dispute AI pipeline needs jurisdiction-aware access to legislation and legal documents to produce grounded, citable answers. Today, precedent search relies on an external stub/API with no admin-managed corpus stored in the project's database. Admins need a dedicated way to ingest, maintain, and test legal documents per jurisdiction (Ukraine and USA) so agents can retrieve complete legal articles via hybrid RAG (BM25 + embeddings) scoped to each room's jurisdiction.

## What Changes

- Add a **RAG** tab within the admin **Settings** page (alongside Credentials, Tests, and Prompts) with jurisdiction-split document lists (Ukrainian and American).
- Introduce database tables for legal documents, text chunks, embeddings, and full-text search indexes in PostgreSQL (pgvector + tsvector).
- Build a document ingestion pipeline: upload TXT/PDF/DOCX → extract text → chunk → embed → store.
- Admin CRUD for documents: name, source URL link, file attachment, jurisdiction, **legal category**, delete, and metadata edits.
- Define eight legal document categories (Labor, Family, Contract, Property, Consumer, Corporate, Insurance, ODR/International) required on every document; category is used to scope RAG search in agent logic.
- Implement hybrid retrieval (BM25 + vector similarity with configurable alpha) filtered by jurisdiction and optionally by category.
- Add an admin **test inquiry** panel to query a selected document (or corpus) with LLM-generated answers and citations.
- Expose a RAG search tool for the dispute AI agent, scoped to the room's `jurisdiction` setting (`ukraine` | `usa`).
- Add maintainable libraries for document parsing, embeddings, and search orchestration.

## Capabilities

### New Capabilities

- `legal-rag`: Core RAG infrastructure — document storage, text extraction, chunking, embedding generation, hybrid search (BM25 + vectors), reranking, and agent-facing retrieval API filtered by jurisdiction and legal category.
- `admin-rag`: Settings RAG tab — jurisdiction-split document lists with category labels, upload/edit/delete forms (jurisdiction + category required), processing status, and test inquiry UI with cited LLM responses.

### Modified Capabilities

- `admin-dashboard`: Add RAG as a fourth horizontal tab within the Settings page (Credentials, Tests, Prompts, RAG).
- `dispute-ai-pipeline`: Agent 2 (Precedents) SHALL query the local legal RAG corpus for the room's jurisdiction in addition to or instead of external precedent APIs.

## Impact

- **Database**: New Drizzle schema + migration (`legal_document_category` enum, `legal_documents`, `document_chunks`, pgvector extension, tsvector indexes); possible `platform_settings` fields for embedding model, chunk size, hybrid alpha.
- **Admin UI**: Extend `/admin/settings` with a RAG tab in `settings-content.tsx`, `rag-settings-content.tsx`, server actions under `app/admin/settings/`, `admin-i18n.ts` copy.
- **Backend**: New `lib/rag/` module (ingest, chunk, embed, search, rerank); OpenAI embeddings API; file storage (DB blob or filesystem path).
- **Pipeline**: `lib/pipeline/precedent-search.ts` and Agent 2 wired to local RAG tool with room jurisdiction and Agent 1 legal-domain → category mapping.
- **Dependencies**: `pgvector` (Postgres extension), `pdf-parse` or `pdfjs-dist`, `mammoth` (DOCX), optional `openai` SDK for embeddings/chat.
- **Infrastructure**: Neon PostgreSQL must support pgvector; file upload size limits in Next.js config.
