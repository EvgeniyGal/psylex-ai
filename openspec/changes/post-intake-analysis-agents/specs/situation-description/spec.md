## MODIFIED Requirements

### Requirement: Pipeline gate on completion

The system SHALL NOT trigger the dispute AI pipeline until every participant in the room has submitted dispute intake (all three dispute-intake questions with `dispute_intake_submitted_at` set on their `users` record) and has a ready personal bot prompt.

#### Scenario: Pipeline waits for all sides

- **WHEN** one or more participants have not yet submitted dispute intake or lack a ready personal bot prompt
- **THEN** the post-intake analysis pipeline is not started for the room
- **AND** no agent outputs are written

#### Scenario: Pipeline triggers on last submission

- **WHEN** the final participant submits dispute intake and all sides have ready personal bot prompts
- **THEN** the post-intake analysis pipeline is triggered automatically for the room

## REMOVED Requirements

### Requirement: Situation submission per side

**Reason**: Dispute intake on the `users` table (three structured questions per side) replaces the shared-room situation description submission flow for pipeline gating.

**Migration**: Participants submit dispute intake at `/dispute-intake` before mediation; pipeline reads `dispute_description`, `dispute_priority`, and `dispute_acceptable_outcome` from `users`.

### Requirement: Cross-side visibility after all submissions

**Reason**: Dispute-intake answers are private per side in the current implementation; cross-side visibility rules for situation descriptions do not apply.

**Migration**: Room-level agents (Interests, Legal Analysis) read both sides' answers server-side without participant UI exposure.
