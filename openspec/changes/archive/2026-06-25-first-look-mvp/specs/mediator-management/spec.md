## ADDED Requirements

### Requirement: Create mediator

An admin SHALL be able to create a mediator from the Mediators tab and associate the mediator with a session.

#### Scenario: Mediator creation

- **WHEN** an admin creates a mediator for a selected session
- **THEN** a new user is created with role `mediator`
- **AND** login is auto-generated in `psylex_<UUID>` format
- **AND** password is auto-generated
- **AND** `session_id` is set to the selected session
- **AND** mediator `title` and `description` are stored

### Requirement: One mediator per session

A session SHALL contain at most one mediator user linked via `session_id`.

#### Scenario: Single mediator constraint

- **WHEN** an admin attempts to create a second mediator for a session that already has one
- **THEN** the operation is rejected with an error message

### Requirement: Display mediator credentials

The Mediators tab SHALL display role, login, and password for each created mediator.

#### Scenario: Mediator credentials visible

- **WHEN** a mediator is created
- **THEN** role, login, and password are displayed on the Mediators tab
- **AND** Copy Credentials and Share / Magic Link actions are available

### Requirement: Mediator title and description

The Mediators tab SHALL display and allow editing of `title` and `description` for each mediator.

#### Scenario: Mediator metadata visible

- **WHEN** an admin views a mediator entry
- **THEN** title and description are shown with role, login, and password

#### Scenario: Mediator metadata editable

- **WHEN** an admin updates mediator title or description
- **THEN** the mediator entry persists and displays the new values

### Requirement: Session participant model

Each session MAY contain exactly one plaintiff, one defendant, and one mediator, all linked by `session_id`.

#### Scenario: Session participant tree

- **WHEN** a fully populated session is viewed
- **THEN** the session has one plaintiff, one defendant, and optionally one mediator linked via `session_id`
