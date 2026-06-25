## ADDED Requirements

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
