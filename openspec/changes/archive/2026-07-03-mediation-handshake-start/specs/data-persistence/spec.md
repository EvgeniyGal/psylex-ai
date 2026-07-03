## ADDED Requirements

### Requirement: Mediation handshake click columns

The `rooms` table SHALL include `side1_mediation_start_clicked_at` (timestamptz, nullable) and `side2_mediation_start_clicked_at` (timestamptz, nullable) to record when each side clicks **Start Mediation** in the lobby handshake.

#### Scenario: Side 1 click persisted

- **WHEN** Side 1 clicks Start Mediation during an active handshake
- **THEN** `side1_mediation_start_clicked_at` is set to the current timestamp

#### Scenario: Side 2 click persisted

- **WHEN** Side 2 clicks Start Mediation during an active handshake
- **THEN** `side2_mediation_start_clicked_at` is set to the current timestamp

#### Scenario: Expired clicks cleared

- **WHEN** the handshake window expires or clicks are too far apart
- **THEN** both click columns are set to null

### Requirement: Mediation session start marker

The `rooms` table SHALL include `mediation_started_at` (timestamptz, nullable) set when the mutual handshake succeeds.

#### Scenario: Mediation start recorded

- **WHEN** both sides complete the handshake within the 60-second window
- **THEN** `mediation_started_at` is set to the timestamp of the second click
- **AND** the value is not overwritten on subsequent lobby visits

### Requirement: Mediation session duration column

The `rooms` table SHALL include `mediation_duration_minutes` (integer, not null, default 20) defining the mediation session length for the room countdown.

#### Scenario: Default duration on room

- **WHEN** a room is created or migrated
- **THEN** `mediation_duration_minutes` defaults to 20

### Requirement: Versioned migration for mediation handshake

Schema changes for mediation handshake columns SHALL be applied through a versioned Drizzle migration tracked in source control.

#### Scenario: Migration adds handshake columns

- **WHEN** migrations are run against a database with existing `rooms` table
- **THEN** handshake click columns, `mediation_started_at`, and `mediation_duration_minutes` are added
