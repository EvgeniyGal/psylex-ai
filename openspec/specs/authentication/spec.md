# Authentication

## Purpose

TBD — User login and session management for PsyLex participants and admins.

## Requirements

### Requirement: Login format

The system SHALL authenticate users using a login string that starts with `psylex_` followed by one or more alphanumeric characters, underscores, or hyphens.

#### Scenario: Valid UUID login accepted

- **WHEN** a user submits login `psylex_550e8400-e29b-41d4-a716-446655440000` with the matching password
- **THEN** authentication succeeds

#### Scenario: Valid custom login accepted

- **WHEN** a user submits login `psylex_admin_anatoliy` with the matching password
- **THEN** authentication succeeds

#### Scenario: Invalid login format rejected

- **WHEN** a user submits a login that does not start with `psylex_` or contains invalid characters
- **THEN** authentication fails with an error message

### Requirement: Plain-text password verification

The system SHALL store and compare passwords as plain text strings without hashing or encryption for MVP.

#### Scenario: Password match

- **WHEN** the submitted password exactly matches the stored password for the user
- **THEN** authentication succeeds

#### Scenario: Password mismatch

- **WHEN** the submitted password does not match the stored password
- **THEN** authentication fails

### Requirement: Session cookie via NextAuth

The system SHALL establish an authenticated session using NextAuth.js with cookie-based session management after successful login.

#### Scenario: Session established on login

- **WHEN** a user successfully authenticates
- **THEN** a session cookie is set
- **AND** the user can access protected admin routes without re-entering credentials

#### Scenario: Unauthenticated access blocked

- **WHEN** an unauthenticated user requests an admin route
- **THEN** the user is redirected to the login page

### Requirement: Role available in session

The authenticated session SHALL include the user's `role` field (`admin`, `mediator`, `plaintiff`, or `defendant`).

#### Scenario: Admin role in session

- **WHEN** an admin user logs in successfully
- **THEN** the session contains `role: admin`
