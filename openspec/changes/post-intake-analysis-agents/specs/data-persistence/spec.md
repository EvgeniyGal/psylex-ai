## ADDED Requirements

### Requirement: Agent prompts table

The database SHALL store editable agent system prompts in an `agent_prompts` table with columns: `id` (UUID, primary key), `agent_key` (unique text), `system_prompt` (text), and `updated_at` (timestamptz).

#### Scenario: Four seeded agent prompts

- **WHEN** migrations are applied on a fresh database
- **THEN** `agent_prompts` contains rows for keys `psychodynamic`, `interests`, `emotional_triggers`, and `legal_analysis`
- **AND** each row has a non-empty default `system_prompt`

### Requirement: User agent output columns

The `users` table SHALL include columns for post-intake per-user agent outputs: `psychodynamic_profile` (jsonb, nullable), `psychodynamic_profile_at` (timestamptz, nullable), `emotional_triggers` (jsonb, nullable), and `emotional_triggers_at` (timestamptz, nullable).

#### Scenario: Psychodynamic profile persisted

- **WHEN** Agent 1 completes for a user
- **THEN** `psychodynamic_profile` stores structured JSON and `psychodynamic_profile_at` is set

#### Scenario: Emotional triggers persisted

- **WHEN** Agent 3 completes for a user
- **THEN** `emotional_triggers` stores structured JSON and `emotional_triggers_at` is set

### Requirement: Room agent output columns

The `rooms` table SHALL include columns for post-intake room-level agent outputs: `interests_analysis` (jsonb, nullable), `interests_analysis_at` (timestamptz, nullable), `legal_analysis` (jsonb, nullable), and `legal_analysis_at` (timestamptz, nullable).

#### Scenario: Interests analysis persisted

- **WHEN** Agent 2 completes for a room
- **THEN** `interests_analysis` stores structured JSON and `interests_analysis_at` is set

#### Scenario: Legal analysis persisted

- **WHEN** Agent 4 completes for a room
- **THEN** `legal_analysis` stores structured JSON and `legal_analysis_at` is set

### Requirement: Post-intake pipeline completion marker

The `rooms` table SHALL include `post_intake_pipeline_started_at` (timestamptz, nullable) and `post_intake_pipeline_completed_at` (timestamptz, nullable) to track pipeline lifecycle for the mediation lobby gate.

#### Scenario: Pipeline lifecycle timestamps

- **WHEN** the post-intake pipeline starts for a room
- **THEN** `post_intake_pipeline_started_at` is set
- **AND** when all agents complete, `post_intake_pipeline_completed_at` is set

### Requirement: Pipeline event logs table

The database SHALL store pipeline observability events in a `pipeline_event_logs` table with columns: `id` (UUID, primary key), `room_id` (UUID foreign key to `rooms`), `user_id` (nullable UUID foreign key to `users`), `agent_key` (text), `event_type` (text), `payload` (jsonb, nullable), and `created_at` (timestamptz).

#### Scenario: Agent completion logged

- **WHEN** any post-intake agent completes successfully
- **THEN** a `pipeline_event_logs` row is created with `event_type` `agent_completed`
- **AND** `agent_key`, `room_id`, and optional `user_id` are recorded
