## ADDED Requirements

### Requirement: RAG settings tab access

The admin Settings page SHALL provide a RAG tab for legal document management, accessible only to users with the `admin` role as part of the existing `/admin/settings` route.

#### Scenario: Admin opens RAG tab

- **WHEN** a logged-in admin navigates to `/admin/settings` and selects the RAG tab
- **THEN** the RAG management interface is displayed within the Settings page

#### Scenario: Non-admin denied

- **WHEN** a non-admin user navigates to `/admin/settings`
- **THEN** access is denied or the user is redirected

### Requirement: Jurisdiction-split document lists

The RAG tab SHALL display two separate document lists: one for Ukrainian jurisdiction and one for American jurisdiction. Each list SHALL show document name, legal category, source URL link, processing status, and upload date. Lists MAY be grouped or filtered by category within each jurisdiction section.

#### Scenario: Ukrainian documents listed

- **WHEN** an admin views the RAG tab in Settings
- **THEN** a Ukrainian jurisdiction section lists all documents tagged `ukraine`

#### Scenario: American documents listed

- **WHEN** an admin views the RAG tab in Settings
- **THEN** an American jurisdiction section lists all documents tagged `usa`

### Requirement: Document upload form

Admins SHALL be able to upload a new legal document by providing: document name (required), source URL link (required), jurisdiction selection (required), legal category selection (required, one of the eight categories), and file attachment (required, TXT/PDF/DOCX).

#### Scenario: Successful upload

- **WHEN** an admin submits a valid upload form with all required fields
- **THEN** the document is created and processing begins
- **AND** a success toast is shown
- **AND** the document appears in the correct jurisdiction list with `pending` or `processing` status

#### Scenario: Missing required field

- **WHEN** an admin submits the form without a required field
- **THEN** validation errors are shown inline
- **AND** no document is created

### Requirement: Document maintenance

Admins SHALL be able to edit a document's display name, source URL link, and legal category, and delete documents from either jurisdiction list.

#### Scenario: Edit document metadata

- **WHEN** an admin updates a document's name, URL, or category and saves
- **THEN** the changes are persisted
- **AND** the updated values appear in the jurisdiction list

#### Scenario: Delete document

- **WHEN** an admin confirms deletion of a document
- **THEN** the document and all indexed content are removed
- **AND** the document disappears from the list

### Requirement: Processing status visibility

The RAG tab SHALL display each document's processing status (`pending`, `processing`, `ready`, `failed`) and show error details when status is `failed`.

#### Scenario: Failed document shows error

- **WHEN** a document has status `failed`
- **THEN** the admin can see the processing error message
- **AND** the admin can retry processing or delete the document

### Requirement: Test inquiry panel

The RAG tab SHALL provide a test inquiry panel where an admin can select a document (or search the jurisdiction corpus), optionally filter by category, enter a natural-language question, and receive an LLM-generated answer with citations to retrieved chunks.

#### Scenario: Admin tests document query

- **WHEN** an admin selects a ready document, enters a question, and submits
- **THEN** the system runs hybrid RAG retrieval scoped to that document's jurisdiction and category
- **AND** an LLM produces an explanation referencing retrieved legal text
- **AND** citations include document name, source URL, and relevant excerpt

#### Scenario: Test inquiry on processing document

- **WHEN** an admin attempts to query a document that is not `ready`
- **THEN** the inquiry is blocked with a message that processing is incomplete

### Requirement: RAG admin i18n

All RAG tab UI labels, buttons, status text, and error messages SHALL be available in English and Ukrainian via the existing `admin-i18n.ts` pattern.

#### Scenario: Ukrainian locale

- **WHEN** the admin UI locale is set to Ukrainian
- **THEN** all RAG tab strings are displayed in Ukrainian
