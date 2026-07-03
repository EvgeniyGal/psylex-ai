# Dispute AI Pipeline

## Purpose

Post-intake four-agent analysis pipeline that runs after both sides complete dispute intake, producing psychodynamic profiles, interests mapping, emotional triggers, and jurisdiction-aware legal analysis before mediation begins.

## Requirements

### Requirement: Automatic psychological profile input

Each agent that requires psychological data SHALL receive the side's psychological characteristics automatically from `personal_bot_prompt` (synced from onboarding tests via Airtable) without manual re-entry by the participant.

#### Scenario: Personal bot prompt used for psychodynamic agent

- **WHEN** Agent 1 (Psychodynamic Profile) runs for a side
- **THEN** the system loads that side's `personal_bot_prompt` from the `users` record
- **AND** no participant input is required beyond completed onboarding and dispute intake

#### Scenario: Personal bot prompt used for emotional triggers agent

- **WHEN** Agent 3 (Emotional Triggers) runs for a side
- **THEN** the system loads that side's `personal_bot_prompt` and dispute-intake answers
- **AND** no additional psychological data entry is required from the participant

### Requirement: Post-intake pipeline supersedes situation-description pipeline

The dispute AI pipeline SHALL be the post-intake four-agent analysis model (psychodynamic profile, interests analysis, emotional triggers, legal analysis) triggered after both sides complete dispute intake, as specified in the `post-intake-agents` capability.

#### Scenario: Pipeline replaces archived agent model

- **WHEN** the dispute AI pipeline is referenced in application code or admin documentation
- **THEN** it refers to the post-intake four-agent model
- **AND** the archived legal-domain / precedents / compatibility / synthesis model is not used
