# Onboarding Tests

## Purpose

Participant psychological test links and Airtable completion sync during onboarding.

## Requirements

### Requirement: External test login email

When the portal opens an external psychological test URL, the `login` query parameter SHALL be the participant's portal login with `@test.com` appended (e.g. `psylex_<UUID>@test.com`). Portal authentication and stored `users.login` SHALL remain the bare `psylex_*` login.

#### Scenario: Test link uses email-form login

- **WHEN** a participant opens a configured test URL from the testing dashboard
- **THEN** the opened URL includes `login=psylex_<id>@test.com`
- **AND** the participant still authenticates to the portal with bare `psylex_<id>`

### Requirement: Airtable completion match by bare login

When syncing test completion or personal-bot prompt from Airtable, the system SHALL match records where the configured email/login field **contains** the bare portal login, not the full `@test.com` address.

#### Scenario: Completion found for email-stored identity

- **WHEN** Airtable stores `psylex_<id>@test.com` in the table's email field
- **AND** the system syncs test status for portal login `psylex_<id>`
- **THEN** the record is matched via a contains/`FIND` filter on the bare login
- **AND** the corresponding test completion (or personal-bot prompt) is synced
