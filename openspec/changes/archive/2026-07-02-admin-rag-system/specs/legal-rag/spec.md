## ADDED Requirements

### Requirement: Legal document storage

The system SHALL persist legal documents in PostgreSQL with metadata: unique id, display name, source URL link, jurisdiction (`ukraine` | `usa`), legal category (see Legal document categories requirement), original filename, MIME type, processing status, uploaded-by user id, and timestamps.

#### Scenario: Document persisted after upload

- **WHEN** an admin uploads a legal document with name, URL, jurisdiction, category, and file attachment
- **THEN** a `legal_documents` record is created with status `pending`
- **AND** the raw file bytes or storage reference is saved

#### Scenario: Jurisdiction required on document

- **WHEN** a document is created without a jurisdiction
- **THEN** the operation is rejected with a validation error

#### Scenario: Category required on document

- **WHEN** a document is created without a legal category
- **THEN** the operation is rejected with a validation error

### Requirement: Legal document categories

The system SHALL support exactly eight legal document categories, stored as a PostgreSQL enum and required on every document:

| Enum value | Label (RU) | Label (EN) |
|------------|------------|------------|
| `labor` | Трудовой | Labor |
| `family` | Семейный | Family |
| `contract` | Договорной | Contract |
| `property` | Имущественный | Property |
| `consumer` | Потребительский | Consumer |
| `corporate` | Корпоративный | Corporate |
| `insurance` | Страховой | Insurance |
| `odr_international` | ODR / Международный | ODR / International |

Categories are jurisdiction-agnostic (the same set applies to Ukrainian and American documents).

#### Scenario: Valid category accepted

- **WHEN** an admin selects any of the eight categories during upload
- **THEN** the category is persisted on the document record

#### Scenario: Invalid category rejected

- **WHEN** a document is created with a category value outside the enum
- **THEN** the operation is rejected with a validation error

### Requirement: Supported document formats

The ingestion pipeline SHALL accept plain text (`.txt`), PDF (`.pdf`), and Word (`.docx`) files.

#### Scenario: TXT ingestion

- **WHEN** an admin uploads a `.txt` file
- **THEN** the system extracts UTF-8 text content for chunking

#### Scenario: PDF ingestion

- **WHEN** an admin uploads a `.pdf` file
- **THEN** the system extracts readable text from all pages

#### Scenario: DOCX ingestion

- **WHEN** an admin uploads a `.docx` file
- **THEN** the system extracts paragraph text for chunking

#### Scenario: Unsupported format rejected

- **WHEN** an admin uploads a file with an unsupported extension
- **THEN** the upload is rejected with a clear error message

### Requirement: Document processing pipeline

After upload, the system SHALL asynchronously process each document: extract text, split into overlapping chunks, generate embeddings, and build full-text search indexes. Processing status SHALL transition `pending` → `processing` → `ready` or `failed`.

#### Scenario: Successful processing

- **WHEN** a document finishes ingestion
- **THEN** its status is set to `ready`
- **AND** all chunks and embeddings are stored and linked to the document

#### Scenario: Processing failure

- **WHEN** text extraction or embedding fails
- **THEN** the document status is set to `failed`
- **AND** an error message is stored for admin visibility

### Requirement: Chunk storage with search indexes

Each document chunk SHALL be stored with: chunk index, text content, token count, optional page/section metadata, a `tsvector` column for BM25/full-text search, and a pgvector embedding column.

#### Scenario: Chunks created with overlap

- **WHEN** a document is processed
- **THEN** text is split into fixed-size chunks with configurable overlap
- **AND** each chunk receives a sequential `chunk_index` within its parent document

### Requirement: Hybrid search retrieval

The RAG search function SHALL combine BM25 (PostgreSQL full-text ranking) and vector cosine similarity scores using a configurable alpha weight (default 0.7 vector / 0.3 BM25, matching existing Legal Data Hunter precedent). Results SHALL be reranked and deduplicated before return.

#### Scenario: Hybrid search returns ranked chunks

- **WHEN** a search query is executed against the corpus
- **THEN** the system computes BM25 and embedding similarity for candidate chunks
- **AND** merges scores using the configured alpha
- **AND** returns the top-k chunks ordered by combined score

#### Scenario: Complete articles returned

- **WHEN** retrieval identifies relevant chunks from the same document
- **THEN** the system MAY expand results to include adjacent chunks from the same document to return complete legal article context

### Requirement: Jurisdiction-scoped search

All RAG search queries SHALL filter results to documents matching the requested jurisdiction. The room jurisdiction enum (`ukraine`, `usa`) SHALL map directly to document jurisdiction without free-text inference.

#### Scenario: Ukrainian room search

- **WHEN** a search is executed with jurisdiction `ukraine`
- **THEN** only documents tagged `ukraine` are included in results

#### Scenario: American room search

- **WHEN** a search is executed with jurisdiction `usa`
- **THEN** only documents tagged `usa` are included in results

### Requirement: Category-scoped search

RAG search queries SHALL accept an optional `category` filter. When provided, only documents matching both the requested jurisdiction and category are included. When omitted, search spans all categories within the jurisdiction.

#### Scenario: Category-filtered search

- **WHEN** a search is executed with jurisdiction `ukraine` and category `family`
- **THEN** only Ukrainian documents tagged `family` are included in results

#### Scenario: Search without category filter

- **WHEN** a search is executed with jurisdiction `usa` and no category
- **THEN** documents from all categories within the American jurisdiction are eligible

### Requirement: Agent RAG tool API

The system SHALL expose a programmatic search function usable by dispute AI agents. The function SHALL accept a natural-language query, jurisdiction, and optional legal category (derived from Agent 1 legal-domain classification), perform hybrid search, and return chunk text with document name, source URL, category, and chunk metadata for citation.

#### Scenario: Agent retrieves citable results

- **WHEN** an agent invokes the RAG search tool with a query, room jurisdiction, and legal category
- **THEN** the tool returns an array of results with `content`, `documentName`, `sourceUrl`, `category`, and `score`
- **AND** results are limited to the specified jurisdiction and category

#### Scenario: Agent search without category

- **WHEN** an agent invokes the RAG search tool without a category (e.g. domain undetermined)
- **THEN** the tool searches all categories within the room jurisdiction
- **AND** results include each document's category for downstream use

### Requirement: Document deletion cascades

Deleting a legal document SHALL remove its raw file reference, all associated chunks, embeddings, and full-text index entries.

#### Scenario: Admin deletes document

- **WHEN** an admin deletes a document from the corpus
- **THEN** the document record and all child chunks are removed
- **AND** the document no longer appears in search results
