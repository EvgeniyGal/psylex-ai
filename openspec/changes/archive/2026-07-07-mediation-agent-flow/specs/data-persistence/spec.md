# Data Persistence

## ADDED Requirements

### Requirement: Mediation phase and round columns

The `rooms` table SHALL include `mediation_phase` (text enum), `mediation_round` (integer, default 0), `mediation_completed_at` (timestamptz, nullable), `side1_ready_for_options_at` (timestamptz, nullable), and `side2_ready_for_options_at` (timestamptz, nullable).

#### Scenario: Phase persisted on transition

- **WHEN** mediation advances from `dialogue` to `generating_options`
- **THEN** `mediation_phase` is updated atomically with an event log entry

### Requirement: Mediation options storage

The `rooms` table SHALL include `mediation_options` (jsonb, nullable) storing 2–3 solution options with canonical fields and per-party presentation payloads, plus optional `compromise_option` (jsonb, nullable).

#### Scenario: Options JSON shape

- **WHEN** solution options are generated
- **THEN** `mediation_options` stores an array of objects each with `id`, canonical `description`, `legal_norms`, `fulfillment_probability`, `refusal_risks`, and per-side presentation fields

### Requirement: Mediation votes storage

The `rooms` table SHALL include `side1_vote_option_id` (text, nullable), `side2_vote_option_id` (text, nullable), `side1_compromise_vote` (boolean, nullable), `side2_compromise_vote` (boolean, nullable), and `selected_option_id` (text, nullable).

#### Scenario: Votes recorded independently

- **WHEN** Side 1 votes in the first round
- **THEN** `side1_vote_option_id` is set without exposing the value to Side 2 until the voting round closes

### Requirement: Agreement and acceptance columns

The `rooms` table SHALL include `draft_agreement` (jsonb, nullable), `side1_agreement_accepted_at` (timestamptz, nullable), `side2_agreement_accepted_at` (timestamptz, nullable), and `agreement_finalized_at` (timestamptz, nullable).

#### Scenario: Draft stored

- **WHEN** the agreement phase begins
- **THEN** `draft_agreement` contains renderable document structure and metadata

### Requirement: Filing receipts table

The database SHALL store filing receipts in a `mediation_filing_receipts` table with columns: `id` (UUID primary key), `room_id` (UUID foreign key), `selected_option_id` (text), `document_version` (text), `content_hash` (text), `side1_accepted_at`, `side2_accepted_at`, and `created_at` (timestamptz).

#### Scenario: Receipt on mutual acceptance

- **WHEN** both parties accept the agreement
- **THEN** a row is inserted into `mediation_filing_receipts`

### Requirement: Mediation agent prompt seed

The `agent_prompts` table SHALL include a default row for `agent_key` `mediation`.

#### Scenario: Migration seeds mediation prompt

- **WHEN** mediation migrations run
- **THEN** a default Mediation Agent system prompt is inserted if not present

### Requirement: Versioned migration for mediation session

Schema changes for mediation session flow SHALL be applied through a versioned Drizzle migration tracked in source control.

#### Scenario: Migration adds mediation columns

- **WHEN** migrations are run against a database with existing `rooms` table
- **THEN** mediation phase, options, vote, agreement, and filing receipt structures are created

### Requirement: Per-party message adaptation metadata

The `room_messages` table SHALL support optional `canonical_content` (text) and `adaptations` (jsonb) columns for agent messages requiring per-party rendering in the shared channel.

#### Scenario: Adaptation stored on send

- **WHEN** an adapted mediation agent message is persisted
- **THEN** `canonical_content` holds the neutral canonical text
- **AND** `adaptations` maps party user IDs or side keys to rendered text
