# Situation Description

## Purpose

Multi-side situation submission phase in the shared room that gates the dispute AI pipeline until every participant has described their case.

## ADDED Requirements

### Requirement: Situation submission per side

Each room participant (Side 1, Side 2 — extensible to additional sides) SHALL submit a situation description in the shared room containing: what happened, why they are raising the dispute, and any relevant supporting information.

#### Scenario: Side submits situation description

- **WHEN** a participant with role `side1` or `side2` (or additional side roles) submits their situation description in the shared room
- **THEN** the submission is persisted with the participant's user ID, room ID, and timestamp
- **AND** the submission is marked as complete for that side

#### Scenario: Submission requires onboarding completion

- **WHEN** a participant who has not completed onboarding (tests and personal bot prompt) attempts to submit a situation description
- **THEN** the submission is rejected
- **AND** the participant is directed to complete onboarding first

### Requirement: Cross-side visibility after all submissions

All sides SHALL be able to see each other's situation descriptions only after every participant in the room has submitted.

#### Scenario: Descriptions hidden until all sides submit

- **WHEN** Side 1 has submitted but Side 2 has not
- **THEN** Side 1 sees only their own submission in the shared room
- **AND** Side 2 sees only their own submission (or a prompt to submit)
- **AND** neither side sees the other's description

#### Scenario: Descriptions visible after all sides submit

- **WHEN** all participants in the room have submitted their situation descriptions
- **THEN** each participant sees all submitted situation descriptions in the shared room
- **AND** each description is attributed to its submitting side

### Requirement: Pipeline gate on completion

The system SHALL NOT trigger the dispute AI pipeline until every participant in the room has submitted their situation description.

#### Scenario: Pipeline waits for all sides

- **WHEN** one or more participants have not yet submitted
- **THEN** the room pipeline state remains `awaiting_situations`
- **AND** no agent pipeline stages are started

#### Scenario: Pipeline triggers on last submission

- **WHEN** the final participant submits their situation description
- **THEN** the room pipeline state transitions to `pipeline_running`
- **AND** the dispute AI pipeline is triggered automatically

### Requirement: Extensible participant count

The situation-description phase SHALL support rooms with 2 to 5 participant sides without schema or UI changes beyond configuration.

#### Scenario: Three-side room

- **WHEN** a room has three side participants
- **THEN** the pipeline gate waits until all three have submitted before triggering
- **AND** all three descriptions become mutually visible only after the third submission
