# Data Persistence

## Purpose

TBD — Database schema, ORM, and migration strategy for PsyLex.

## Requirements

### Requirement: Users table schema

The database SHALL store users in a `users` table with columns: `id` (UUID, primary key), `login` (unique string), `password` (plain text string), `role` (enum: admin, mediator, plaintiff, defendant), `title` (string), `description` (text), and `session_id` (nullable UUID foreign key).

#### Scenario: User record structure

- **WHEN** a user is persisted
- **THEN** all required fields are stored with correct types
- **AND** `login` is unique across all users

### Requirement: Sessions table schema

The database SHALL store sessions in a `sessions` table with columns: `id` (UUID, primary key), `title` (string), `description` (text), and `created_at` (timestamp).

#### Scenario: Session record structure

- **WHEN** a session is persisted
- **THEN** `id` is a UUID and `created_at` is set to the creation time
- **AND** `title` and `description` are stored for display in admin UI

### Requirement: Session-to-user relation

Users SHALL reference their session via `session_id`. A session's participants are users where `users.session_id` equals the session's `id`.

#### Scenario: Participant lookup

- **WHEN** querying participants for a session
- **THEN** all users with matching `session_id` are returned

### Requirement: Drizzle ORM with type safety

The application SHALL use Drizzle ORM for all database access with schema-first design and Zod-validated insert/select types.

#### Scenario: Type-safe query

- **WHEN** application code queries users or sessions
- **THEN** Drizzle schema types are used
- **AND** runtime validation uses Zod schemas derived from Drizzle tables

### Requirement: Versioned migrations

Database schema changes SHALL be applied through versioned Drizzle migrations tracked in source control and enforced in CI/CD.

#### Scenario: Migration applied

- **WHEN** migrations are run against a fresh database
- **THEN** `users` and `sessions` tables are created with correct schema
- **AND** migration history is recorded in the migrations folder

### Requirement: Neon PostgreSQL

The production and development databases SHALL use PostgreSQL hosted on Neon, connected via `DATABASE_URL` environment variable.

#### Scenario: Database connection

- **WHEN** the application starts with a valid `DATABASE_URL`
- **THEN** Drizzle connects to the Neon PostgreSQL instance successfully

### Requirement: Room messages table

The database SHALL store chat messages in a `room_messages` table with columns: `id` (UUID, primary key), `room_id` (UUID foreign key to `rooms`), `channel` (enum: `shared`, `private`), `participant_user_id` (nullable UUID foreign key to `users` — required when channel is `private`), `sender_type` (enum: `participant`, `agent`), `sender_agent` (nullable text — agent identifier when `sender_type` is `agent`), `sender_user_id` (nullable UUID foreign key to `users`), `content` (text), `content_by_locale` (jsonb, nullable — `{ "en": "...", "uk": "..." }` for localized agent shared-room messages), and `created_at` (timestamp).

#### Scenario: Shared message persisted

- **WHEN** a participant posts in the shared room
- **THEN** a `room_messages` row is created with `channel = shared` and `participant_user_id` null

#### Scenario: Private message persisted

- **WHEN** an agent sends a clarifying question to Side 1
- **THEN** a `room_messages` row is created with `channel = private` and `participant_user_id` equal to Side 1's user ID
- **AND** `content` is in Side 1's `preferred_locale` (single-locale text)

### Requirement: Participant locale preference column

The `users` table SHALL include a `preferred_locale` column (enum: `en`, `uk`, default `en`) storing each participant's language preference for agent messages and room UI.

#### Scenario: Locale stored on user

- **WHEN** a participant sets locale via LocaleSwitcher
- **THEN** `users.preferred_locale` is updated to `en` or `uk`

#### Scenario: Locale used by pipeline

- **WHEN** an agent generates a private-thread message for a user
- **THEN** the pipeline reads `preferred_locale` from that user's record

### Requirement: Room pipeline state table

The database SHALL store pipeline state per room in a `room_pipeline_states` table with columns: `room_id` (UUID primary key, foreign key to `rooms`), `status` (enum: `awaiting_situations`, `pipeline_running`, `awaiting_clarification`, `options_published`, `post_resolution`), agent output fields (`legal_domain`, `jurisdiction`, `applicable_norms`, `case_law_results`, `compatibility_analysis` as text/json), per-side clarification flags (`clarification_complete_s1`, `clarification_complete_s2` booleans, extensible), `current_agent` (nullable text), `updated_at` (timestamp), and `created_at` (timestamp).

#### Scenario: Pipeline state on room creation

- **WHEN** a room is created with participants
- **THEN** a `room_pipeline_states` row is created with `status = awaiting_situations`

#### Scenario: Agent outputs stored

- **WHEN** Agent 1 completes
- **THEN** `legal_domain`, `jurisdiction`, and `applicable_norms` are persisted on the room's pipeline state row

### Requirement: Situation descriptions table

The database SHALL store per-participant situation submissions in a `situation_descriptions` table with columns: `id` (UUID primary key), `room_id` (UUID foreign key), `user_id` (UUID foreign key), `what_happened` (text), `why_dispute` (text), `supporting_info` (text), `submitted_at` (timestamp), with a unique constraint on (`room_id`, `user_id`).

#### Scenario: One submission per side

- **WHEN** a side submits their situation description
- **THEN** exactly one row exists per (`room_id`, `user_id`) pair
- **AND** resubmission updates the existing row

### Requirement: Psychological profiles storage

The database SHALL store or derive psychological profiles from onboarding data (`user_test_completions`, `personal_bot_prompt`) accessible by `user_id` for pipeline agent input without duplicate manual entry.

#### Scenario: Profile available for pipeline

- **WHEN** Agent 3 requests profiles for room participants
- **THEN** profile data is assembled from the participant's test completions and `personal_bot_prompt`
- **AND** no separate manual profile table entry is required from the participant

### Requirement: Agent prompts table

The database SHALL store agent system prompts in an `agent_prompts` table with columns: `agent_key` (text primary key: `legal_domain`, `precedents`, `compatibility`, `synthesis`), `system_prompt` (text), and `updated_at` (timestamp).

#### Scenario: Default prompts seeded

- **WHEN** migrations run on a fresh database
- **THEN** four `agent_prompts` rows exist with default system prompts for each agent

### Requirement: Pipeline event log table

The database SHALL store pipeline events in a `pipeline_event_logs` table with columns: `id` (UUID primary key), `room_id` (UUID foreign key), `event_type` (text), `agent_key` (nullable text), `payload` (jsonb), and `created_at` (timestamp).

#### Scenario: Stage transition logged

- **WHEN** Agent 1 completes and Agents 2/3 start
- **THEN** pipeline event log entries record Agent 1 completion and Agents 2/3 start with timestamps

### Requirement: Versioned migrations for dispute pipeline

All new tables and columns for the dispute pipeline SHALL be applied through versioned Drizzle migrations tracked in source control.

#### Scenario: Migration creates dispute tables

- **WHEN** migrations are run against a database with existing `rooms` and `users` tables
- **THEN** `room_messages`, `room_pipeline_states`, `situation_descriptions`, `agent_prompts`, and `pipeline_event_logs` tables are created
