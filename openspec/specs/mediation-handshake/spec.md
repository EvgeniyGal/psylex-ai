# Mediation Handshake

## Purpose

Synchronized two-party mediation start from the lobby — persistent mutual-click handshake, session gate, and session countdown timer.

## Requirements

### Requirement: Start Mediation button gated on pipeline completion

The mediation lobby SHALL enable the **Start Mediation** button only when `canStartMediation` is true (both sides ready and post-intake pipeline complete). This existing gate SHALL remain unchanged.

#### Scenario: Button disabled while agents run

- **WHEN** both sides are ready but post-intake agents have not finished
- **THEN** the Start Mediation button is disabled
- **AND** the agents-working message is shown

#### Scenario: Button enabled when ready

- **WHEN** both sides are ready and post-intake pipeline is complete
- **THEN** the Start Mediation button is enabled

### Requirement: Mutual click without expiry

Mediation SHALL NOT begin until both Side 1 and Side 2 click **Start Mediation**. Clicks do not expire — once a party clicks, their intent persists until the other party also clicks.

#### Scenario: First side clicks

- **WHEN** one side clicks Start Mediation and the opposite side has not clicked
- **THEN** that side's click timestamp is recorded on the room
- **AND** the clicking participant sees a waiting state
- **AND** the opposite side is notified via realtime that the first side is waiting
- **AND** mediation does not start yet

#### Scenario: Second side clicks

- **WHEN** the opposite side clicks Start Mediation (at any point after the first click)
- **THEN** `mediation_started_at` is set on the room
- **AND** both participants are directed to `/room`

#### Scenario: Simultaneous clicks (race safety)

- **WHEN** both sides click Start Mediation at nearly the same time
- **THEN** both click timestamps are recorded
- **AND** exactly one finalization occurs (atomic `SET mediation_started_at WHERE IS NULL` guard)
- **AND** both participants see the `started` status and are redirected to `/room`

### Requirement: Opposite-side handshake status in lobby

While waiting for the handshake, the mediation lobby SHALL show the participant whether the opposite side has clicked **Start Mediation**.

#### Scenario: Waiting for opposite side

- **WHEN** the participant has clicked Start Mediation and the opposite side has not
- **THEN** a localized message indicates the opposite side has not clicked yet

#### Scenario: Opposite side already clicked

- **WHEN** the participant has not clicked but the opposite side has already clicked
- **THEN** a localized message indicates the opposite side is ready and prompts this participant to click Start Mediation

### Requirement: Lobby realtime updates for handshake completion

The mediation lobby SHALL receive realtime updates while a handshake is in progress so participants are redirected without manual refresh when mediation starts.

#### Scenario: Automatic redirect on start

- **WHEN** a participant is in the waiting state and the opposite side completes the handshake
- **THEN** the browser detects `mediation_started_at` via realtime within 5 seconds
- **AND** the participant is redirected to `/room`

### Requirement: Room access gated on mediation start

The `/room` route SHALL be accessible to side participants only when `rooms.mediation_started_at` is set for their room.

#### Scenario: Blocked before handshake

- **WHEN** a participant navigates to `/room` before mediation has started
- **THEN** they are redirected to `/mediation`

#### Scenario: Allowed after handshake

- **WHEN** a participant navigates to `/room` after `mediation_started_at` is set
- **THEN** the mediation room page is rendered

#### Scenario: Lobby skips handshake when already started

- **WHEN** a participant visits `/mediation` and `mediation_started_at` is already set
- **THEN** they are redirected to `/room`

### Requirement: 20-minute mediation countdown

The mediation room SHALL display a countdown timer showing remaining session time, defaulting to **20 minutes** from `mediation_started_at`. When the timer reaches zero during an active mediation session, the system SHALL apply mediation session flow transition rules (advance to solution-option generation or close the current phase per `mediation-session-flow`) rather than showing only a placeholder message.

#### Scenario: Countdown visible at start

- **WHEN** a participant enters `/room` immediately after mediation starts
- **THEN** the countdown shows approximately 20:00 remaining

#### Scenario: Countdown decrements

- **WHEN** time passes during an active mediation session
- **THEN** the displayed countdown decreases each second

#### Scenario: Countdown reaches zero

- **WHEN** the countdown reaches 00:00 during `opening`, `dialogue`, or `generating_options`
- **THEN** the mediation session flow timer-expiry transition runs
- **AND** participants see a localized notice that the dialogue time has ended
- **AND** the session continues into solution options or voting per current phase rules

### Requirement: Handshake server guard

Server actions for recording Start Mediation clicks SHALL reject requests when `canStartMediation` is false, even if the client button state is stale.

#### Scenario: Reject ineligible click

- **WHEN** a participant invokes the start-click action but post-intake pipeline is incomplete
- **THEN** the action returns `ineligible` status
- **AND** no click timestamp is recorded
