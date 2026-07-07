# Room Messaging

## ADDED Requirements

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
