## ADDED Requirements

### Requirement: Start Mediation button gated on pipeline completion

The mediation lobby SHALL enable the **Start Mediation** button only when `canStartMediation` is true (both sides ready and post-intake pipeline complete). This existing gate SHALL remain unchanged.

#### Scenario: Button disabled while agents run

- **WHEN** both sides are ready but post-intake agents have not finished
- **THEN** the Start Mediation button is disabled
- **AND** the agents-working message is shown

#### Scenario: Button enabled when ready

- **WHEN** both sides are ready and post-intake pipeline is complete
- **THEN** the Start Mediation button is enabled

### Requirement: Mutual handshake within 60 seconds

Mediation SHALL NOT begin until both Side 1 and Side 2 click **Start Mediation** with clicks occurring within **60 seconds** of each other (measured from the first click to the second).

#### Scenario: First side clicks

- **WHEN** one side clicks Start Mediation and the opposite side has not clicked
- **THEN** that side's click timestamp is recorded on the room
- **AND** the clicking participant sees a waiting state
- **AND** mediation does not start yet

#### Scenario: Second side clicks within window

- **WHEN** the opposite side clicks Start Mediation within 60 seconds of the first click
- **THEN** `mediation_started_at` is set on the room
- **AND** both participants are directed to `/room`

#### Scenario: Solo click expires

- **WHEN** only one side has clicked and 60 seconds elapse without the opposite side clicking
- **THEN** the recorded click is cleared
- **AND** both sides must click Start Mediation again

#### Scenario: Clicks too far apart

- **WHEN** both sides have clicked but the second click is more than 60 seconds after the first
- **THEN** both click timestamps are cleared
- **AND** both sides must click Start Mediation again

### Requirement: Opposite-side handshake status in lobby

While waiting for the handshake, the mediation lobby SHALL show the participant whether the opposite side has clicked **Start Mediation**.

#### Scenario: Waiting for opposite side

- **WHEN** the participant has clicked Start Mediation and the opposite side has not
- **THEN** a localized message indicates the opposite side has not clicked yet
- **AND** remaining time in the 60-second window is shown when applicable

#### Scenario: Opposite side already clicked

- **WHEN** the participant has not clicked but the opposite side has clicked within the active window
- **THEN** a localized message indicates the opposite side is ready and prompts this participant to click Start Mediation

#### Scenario: Window expired message

- **WHEN** the handshake window expires
- **THEN** a localized message instructs the participant to click Start Mediation again

### Requirement: Lobby polling for handshake completion

The mediation lobby SHALL poll server state while a handshake is in progress so participants are redirected without manual refresh when mediation starts.

#### Scenario: Automatic redirect on start

- **WHEN** a participant is in the waiting state and the opposite side completes the handshake
- **THEN** the browser detects `mediation_started_at` via polling within 5 seconds
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

The mediation room SHALL display a countdown timer showing remaining session time, defaulting to **20 minutes** from `mediation_started_at`.

#### Scenario: Countdown visible at start

- **WHEN** a participant enters `/room` immediately after mediation starts
- **THEN** the countdown shows approximately 20:00 remaining

#### Scenario: Countdown decrements

- **WHEN** time passes during an active mediation session
- **THEN** the displayed countdown decreases each second

#### Scenario: Countdown reaches zero

- **WHEN** the countdown reaches 00:00
- **THEN** a localized session-ended message is shown
- **AND** no additional mediation logic is triggered (placeholder for future work)

### Requirement: Handshake server guard

Server actions for recording Start Mediation clicks SHALL reject requests when `canStartMediation` is false, even if the client button state is stale.

#### Scenario: Reject ineligible click

- **WHEN** a participant invokes the start-click action but post-intake pipeline is incomplete
- **THEN** the action returns `ineligible` status
- **AND** no click timestamp is recorded
