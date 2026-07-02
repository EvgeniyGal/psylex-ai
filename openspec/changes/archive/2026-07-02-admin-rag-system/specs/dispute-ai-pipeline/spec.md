## MODIFIED Requirements

### Requirement: Agent 2 precedent research

Agent 2 SHALL research relevant case law, judicial precedents, and applicable legislation for the classified legal domain using the local legal RAG corpus filtered by the room's jurisdiction setting (`rooms.jurisdiction`) and the legal category mapped from Agent 1's `legal_domain` output. The local RAG search SHALL be the primary retrieval source. External legal APIs MAY be used as a fallback when configured. Output SHALL be stored as `case_law_results` on the room pipeline record.

#### Scenario: Precedent research completes

- **WHEN** Agent 2 runs after Agent 1 completes
- **THEN** `case_law_results` is persisted on the room pipeline record
- **AND** the result is not displayed in the shared room chat

#### Scenario: Jurisdiction- and category-scoped local RAG

- **WHEN** Agent 2 runs for a room with jurisdiction `ukraine` and Agent 1 classified the dispute as family law
- **THEN** the RAG search tool queries only Ukrainian legal documents in the `family` category
- **AND** retrieved results include document name, category, and source URL for citation

#### Scenario: Category mapping from Agent 1

- **WHEN** Agent 1 outputs a `legal_domain` value
- **THEN** the system maps it to one of the eight legal document categories before invoking RAG search
- **AND** if no confident mapping exists, RAG search runs across all categories within the room jurisdiction

#### Scenario: Local corpus empty

- **WHEN** Agent 2 runs and no documents exist for the room's jurisdiction
- **THEN** Agent 2 proceeds with an empty local result set or configured external fallback
- **AND** the pipeline does not fail solely due to an empty corpus
