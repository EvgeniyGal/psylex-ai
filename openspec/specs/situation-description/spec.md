# Situation Description

## Purpose

Dispute-intake completion gates the post-intake analysis pipeline. The legacy per-side situation description submission flow in the shared room is deprecated in favor of structured dispute-intake answers on `users`.

## Requirements

### Requirement: Pipeline gate on completion

The system SHALL NOT trigger the dispute AI pipeline until every participant in the room has submitted dispute intake (all three dispute-intake questions with `dispute_intake_submitted_at` set on their `users` record) and has a ready personal bot prompt.

#### Scenario: Pipeline waits for all sides

- **WHEN** one or more participants have not yet submitted dispute intake or lack a ready personal bot prompt
- **THEN** the post-intake analysis pipeline is not started for the room
- **AND** no agent outputs are written

#### Scenario: Pipeline triggers on last submission

- **WHEN** the final participant submits dispute intake and all sides have ready personal bot prompts
- **THEN** the post-intake analysis pipeline is triggered automatically for the room

### Requirement: Extensible participant count

The situation-description phase SHALL support rooms with 2 to 5 participant sides without schema or UI changes beyond configuration.

#### Scenario: Three-side room

- **WHEN** a room has three side participants
- **THEN** the pipeline gate waits until all three have submitted before triggering
- **AND** all three descriptions become mutually visible only after the third submission
