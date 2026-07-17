# Mediation Session Flow

## Purpose

Participant-facing orchestration of live mediation phases—timers, dialogue rounds, ready-for-solutions handshake, transitions, voting, and session completion.

## Requirements

### Requirement: Mediation phase state machine

Each room with active mediation SHALL track a `mediation_phase` enum: `opening`, `dialogue`, `generating_options`, `voting`, `voting_discrepancy`, `agreement`, `completed`.

#### Scenario: Phase advances on opening complete

- **WHEN** opening presentations are delivered to both parties
- **THEN** `mediation_phase` is set to `dialogue`
- **AND** dialogue round 1 begins

#### Scenario: Phase advances to voting

- **WHEN** solution options are published
- **THEN** `mediation_phase` is set to `voting`

### Requirement: Sixty-minute session timer

The mediation session SHALL enforce a total duration of **60 minutes** from `mediation_started_at` (or `rooms.mediation_duration_minutes` when overridden), governing dialogue and option-generation phases.

#### Scenario: Timer visible throughout session

- **WHEN** a participant is in `/room` during an active mediation session before `completed`
- **THEN** a countdown shows remaining session time derived from `mediation_started_at`

#### Scenario: Timer expiry triggers transition

- **WHEN** the session timer reaches zero during `opening`, `dialogue`, or `generating_options`
- **THEN** the system transitions to `generating_options` if not already past that phase
- **AND** if options already exist, the current phase advances per phase rules (e.g., force voting closure)
- **AND** a system event is logged with reason `timer_expired`

### Requirement: Dialogue rounds up to three

The system SHALL run up to **3** dialogue rounds. Each round consists of structured agent questions to each party in turn followed by a round summary.

#### Scenario: Round progression

- **WHEN** round N summary is posted and N < 3
- **THEN** round N+1 begins unless a transition condition is met
- **WHEN** round 3 summary is posted
- **THEN** the system transitions to `generating_options` unless already transitioned earlier

### Requirement: Five-minute reply timer

Each participant SHALL have **5 minutes** to submit a reply when it is their turn in dialogue.

#### Scenario: Reply timer shown

- **WHEN** it is a participant's turn to reply
- **THEN** a 5:00 countdown is displayed for that participant

#### Scenario: Reply timer expires

- **WHEN** the 5-minute reply timer expires without a submission
- **THEN** the turn is marked timed out
- **AND** the dialogue state advances to the next turn or round summary
- **AND** no nudge message is posted

### Requirement: Ready for solution options button

A button labeled **"I am ready for solution options"** (localized) SHALL be visible to both parties throughout `opening`, `dialogue`, and `generating_options` phases.

#### Scenario: Button always available

- **WHEN** a participant views the mediation room during `dialogue`
- **THEN** the ready-for-solutions button is enabled and visible

#### Scenario: Both parties ready ends dialogue

- **WHEN** both parties have clicked the ready-for-solutions button
- **THEN** dialogue rounds stop immediately
- **AND** `mediation_phase` transitions to `generating_options`
- **AND** ready click timestamps are persisted per side

#### Scenario: Single party ready waits

- **WHEN** only one party has clicked ready
- **THEN** dialogue continues
- **AND** the clicking party sees confirmation that the system is waiting for the other party

### Requirement: Transition to solution options

The system SHALL transition from dialogue to solution-option generation when **any** of the following occurs: (1) 3 dialogue rounds completed, (2) both parties clicked ready for solutions, (3) 60-minute session timer expired.

#### Scenario: Three rounds complete

- **WHEN** the third dialogue round summary is posted
- **THEN** transition to `generating_options` occurs

### Requirement: Independent blind voting

During `voting`, each party SHALL select one solution option independently. Votes SHALL NOT be revealed to the other party until the voting round concludes.

#### Scenario: Vote submitted hidden

- **WHEN** Side 1 submits a vote for option B
- **THEN** Side 1 sees their selection confirmed
- **AND** Side 2 cannot see Side 1's choice while voting is open

#### Scenario: Both voted reveals outcome

- **WHEN** both parties have submitted votes in the first voting round
- **THEN** the system evaluates match or discrepancy
- **AND** both parties see the outcome type (`match` or `discrepancy`)

### Requirement: Match proceeds to agreement

When both parties vote for the **same** option in the first voting round, the system SHALL set the selected option as the agreement basis and transition to `agreement`.

#### Scenario: Matching votes

- **WHEN** Side 1 and Side 2 both vote for option 2
- **THEN** `selected_option_id` is set to option 2
- **AND** `mediation_phase` becomes `agreement`

### Requirement: Discrepancy second round

When first-round votes differ, the system SHALL enter `voting_discrepancy`: reveal each party's choice to the other, present one AI-generated compromise option, and hold a **one-time** second vote.

#### Scenario: Discrepancy flow

- **WHEN** first-round votes differ
- **THEN** each party sees the other's selection
- **AND** a compromise option is generated and displayed
- **AND** parties vote again on the compromise option only
- **AND** no third voting round is offered

#### Scenario: Compromise accepted

- **WHEN** both parties accept the compromise option in the second vote
- **THEN** `mediation_phase` becomes `agreement`

#### Scenario: Compromise rejected

- **WHEN** the second vote does not produce mutual acceptance
- **THEN** `mediation_phase` becomes `completed` without a signed agreement
- **AND** participants see a localized no-agreement outcome with download of session results where available

### Requirement: Session completion

When agreement is signed or the no-agreement path completes, the system SHALL set `mediation_phase` to `completed` and persist a filing receipt.

#### Scenario: Successful completion

- **WHEN** both parties accept the draft agreement
- **THEN** `mediation_phase` is `completed`
- **AND** `mediation_completed_at` is set
- **AND** a filing receipt record is saved
