# Post-Resolution Dialogue

## Purpose

Shared-room follow-up conversation after resolution options are published, including option rejection and AI-generated alternatives.

## Requirements

### Requirement: Follow-up questions in shared room

After Agent 4 publishes three resolution options, both sides SHALL be able to ask follow-up questions in the shared room chat.

#### Scenario: Participant asks follow-up

- **WHEN** a side posts a follow-up question in the shared room after options are published
- **THEN** the message is stored in the shared channel with timestamp ordering
- **AND** the AI responds in the shared room in each viewer's `preferred_locale` (see message-localization)

### Requirement: Option rejection and alternatives

Either side SHALL be able to reject the published resolution options and request new alternatives. The AI SHALL iterate and propose new options in response.

#### Scenario: Side rejects options

- **WHEN** a participant rejects the current resolution options and requests alternatives in the shared room
- **THEN** the rejection is stored as a shared-room message
- **AND** the AI generates and publishes a new set of resolution options to the shared room with `en` and/or `uk` content per room locale needs
- **AND** prior options remain in message history but are superseded by the new set in the active options context

#### Scenario: Iteration preserves history

- **WHEN** new resolution options are generated after rejection
- **THEN** all prior messages (including previous option sets and dialogue) remain stored in order
- **AND** the latest option set is clearly identifiable as the active proposal

### Requirement: Dialogue available only after options published

Post-resolution dialogue SHALL be available only when the room pipeline state is `options_published` or a subsequent post-resolution state.

#### Scenario: Dialogue blocked before options

- **WHEN** the room pipeline has not yet published resolution options
- **THEN** participants cannot initiate post-resolution follow-up or rejection flows
- **AND** the shared room shows only situation descriptions and system status messages appropriate to the current phase

### Requirement: All dialogue messages persisted

All post-resolution messages from participants and the AI SHALL be stored in the shared room channel in order of arrival.

#### Scenario: Full dialogue history

- **WHEN** a participant reviews the shared room after multiple follow-up exchanges
- **THEN** all messages from both sides and the AI appear in chronological order
- **AND** each message includes sender attribution and timestamp
