# Room Messaging

## Purpose

Shared room chat and per-side private threads with role-appropriate visibility and ordered message persistence.

## Requirements

### Requirement: Shared room channel

Each room SHALL have a shared chat channel visible to all room participants (sides and mediator when present) used for situation descriptions, published resolution options, and post-resolution dialogue.

#### Scenario: Shared room visibility

- **WHEN** a participant opens the shared room chat for their room
- **THEN** they see messages intended for the shared channel
- **AND** they do not see messages from another participant's private thread

### Requirement: Private thread per side

Each side participant SHALL have a private thread visible only to that participant, used for agent-directed clarifying questions (Agent 1 jurisdiction queries, Agent 4 clarification Q&A).

#### Scenario: Private thread isolation

- **WHEN** Agent 4 sends a clarifying question to Side 1
- **THEN** the message is stored in Side 1's private thread
- **AND** Side 2 cannot see the message
- **AND** Side 1 sees the message in their private thread view

#### Scenario: Side responds in private thread

- **WHEN** Side 1 replies to an agent question in their private thread
- **THEN** the reply is stored with channel `private` and the side's user ID
- **AND** the pipeline receives the response to continue the relevant agent stage

### Requirement: Ordered message persistence

All messages — from participants and agents — SHALL be stored in the database with room ID, channel type (`shared` or `private`), sender identity, content, and timestamp, ordered by arrival time.

#### Scenario: Message ordering

- **WHEN** multiple messages are sent in the shared room or a private thread
- **THEN** messages are retrieved ordered by `created_at` ascending
- **AND** each message retains its original arrival order

### Requirement: Participant room access after onboarding

A side participant SHALL access the room chat experience only after completing onboarding (tests and personal bot prompt ready).

#### Scenario: Room unlocked after onboarding

- **WHEN** a participant completes onboarding (`onboardingCompletedAt` and `personalBotReadyAt` set)
- **THEN** they can navigate to their room's chat interface
- **AND** they can submit their situation description in the shared room

### Requirement: Channel type enumeration

Messages SHALL be classified by channel: `shared` for the room chat, or `private` with a `participant_user_id` for side-specific threads.

#### Scenario: Channel assignment on send

- **WHEN** a participant posts in the shared room
- **THEN** the message is stored with channel `shared` and no private participant filter
- **WHEN** an agent posts a clarifying question to Side 1
- **THEN** the message is stored with channel `private` and `participant_user_id` equal to Side 1's user ID

### Requirement: Per-party adapted agent messages in shared channel

Agent messages in the shared channel MAY carry a canonical content payload plus per-party adapted renderings. Each adaptation SHALL use that party's `preferred_locale` and psychodynamic profile. Each participant SHALL see only their own adapted rendering (and neutral system messages), not the other party's adapted text.

#### Scenario: Viewer-specific rendering

- **WHEN** the Mediation Agent posts an opening or option message with per-party adaptations
- **THEN** the message is stored once in `room_messages` with canonical and adaptation metadata
- **AND** Side 1's client requests or receives the Side 1 rendering
- **AND** Side 2's client receives the Side 2 rendering
- **AND** neither side receives the other's adapted text over the API

#### Scenario: Participant messages remain shared

- **WHEN** a participant posts a substantive reply during dialogue
- **THEN** the message is stored with channel `shared` and visible to both parties as written
- **AND** no per-party rendering is applied to participant-authored content

### Requirement: Mediation message types

Mediation-related messages SHALL support a `message_kind` discriminator including at minimum: `mediation_opening`, `mediation_question`, `mediation_summary`, `mediation_moderation`, `mediation_options`, `mediation_system`.

#### Scenario: Options message kind

- **WHEN** solution options are published to the shared channel
- **THEN** each options message uses `message_kind` `mediation_options`
- **AND** per-party presentation is resolved at read time from stored metadata
