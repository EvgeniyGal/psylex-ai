# Session Management

## Purpose

TBD — Admin workflows for creating and managing mediation sessions and participants.

## Requirements

### Requirement: Create session

An admin SHALL be able to create a new session from the Sessions tab. Creating a session MUST automatically create one plaintiff user and one defendant user linked to that session.

#### Scenario: Session creation side effects

- **WHEN** an admin clicks create session
- **THEN** a new session record is created with a UUID and `created_at` timestamp
- **AND** a plaintiff user is created with role `plaintiff` and `session_id` set to the new session
- **AND** a defendant user is created with role `defendant` and `session_id` set to the new session
- **AND** each user receives an auto-generated `psylex_<UUID>` login and auto-generated password
- **AND** the session receives a title and description
- **AND** plaintiff and defendant each receive a title and description

### Requirement: Session title and description

Each session SHALL include a `title` and `description` that are displayed in the Sessions tab and editable by admin.

#### Scenario: Session metadata visible

- **WHEN** an admin opens the Sessions tab
- **THEN** each session card shows session title and description with creation timestamp

#### Scenario: Session metadata editable

- **WHEN** an admin edits a session title or description
- **THEN** the updated values are saved and shown in the sessions list

### Requirement: Plaintiff and defendant title and description

Plaintiff and defendant participants SHALL include `title` and `description` fields shown in the Sessions tab.

#### Scenario: Participant metadata visible

- **WHEN** a session is displayed
- **THEN** plaintiff and defendant blocks each show title, description, role, login, and password

#### Scenario: Participant metadata editable

- **WHEN** an admin edits plaintiff or defendant title/description
- **THEN** the updated values are saved and displayed immediately

### Requirement: Display participant credentials

For every participant in a session, the Sessions tab SHALL display role, login, and password in plain text.

#### Scenario: Credentials visible after creation

- **WHEN** a session is created or listed
- **THEN** the plaintiff credentials show role, login, and password
- **AND** the defendant credentials show role, login, and password
- **AND** mediator credentials are shown when a mediator exists for the session

### Requirement: Copy credentials

Each participant entry SHALL include a "Copy Credentials" button that copies a formatted credential block to the clipboard. Field labels and the role display name SHALL use the active UI locale (English or Ukrainian). Role values SHALL be human-readable (e.g. `Party A` / `Сторона А`), not raw keys like `party_a`.

#### Scenario: Copy credentials action (English)

- **WHEN** an admin or mediator with English locale clicks "Copy Credentials" for a Party A participant
- **THEN** the clipboard contains text in the format:
  ```
  Role: Party A
  Login: <login>
  Password: <password>
  ```
- **AND** a success toast confirms the copy

#### Scenario: Copy credentials action (Ukrainian)

- **WHEN** an admin or mediator with Ukrainian locale clicks "Копіювати дані" for a Party A participant
- **THEN** the clipboard contains text in the format:
  ```
  Роль: Сторона А
  Логін: <login>
  Пароль: <password>
  ```
- **AND** a success toast confirms the copy

### Requirement: Share credentials

Each participant entry SHALL include a "Share / Magic Link" button that prepares the same credential block for sharing via external messengers.

#### Scenario: Share credentials action

- **WHEN** an admin clicks "Share / Magic Link" for a participant
- **THEN** a shareable message is prepared containing role, login, and password
- **AND** the Web Share API is used when available, otherwise the message is copied to clipboard

### Requirement: Session listing

The Sessions tab SHALL list all sessions with their participants and creation timestamps.

#### Scenario: Sessions list

- **WHEN** an admin opens the Sessions tab
- **THEN** all sessions are listed ordered by `created_at` descending
- **AND** each session shows its participants and credentials
