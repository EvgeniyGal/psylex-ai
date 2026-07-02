## REMOVED Requirements

### Requirement: Pipeline execution order

**Reason**: Replaced by post-intake analysis pipeline with per-user then room-level agent topology (see `post-intake-agents` capability).

**Migration**: Use the post-intake pipeline execution order defined in `post-intake-agents`.

### Requirement: Agent 1 legal domain classification

**Reason**: Legal domain classification is folded into Agent 4 (Legal Analysis) in the post-intake pipeline; no separate legal-domain agent.

**Migration**: Legal domain and applicable norms are produced as part of `legal_analysis` on `rooms`.

### Requirement: Agent 2 precedent research

**Reason**: Precedent research is replaced by Agent 4 (Legal Analysis) using the local RAG corpus directly from dispute-intake answers.

**Migration**: Use `legal_analysis` on `rooms` with RAG citations.

### Requirement: Agent 3 compatibility analysis

**Reason**: Compatibility analysis is replaced by Agent 2 (Interests Analysis) for conflicting interests and common ground, plus per-user psychodynamic and emotional-trigger agents.

**Migration**: Use `interests_analysis` on `rooms` and per-user `psychodynamic_profile` / `emotional_triggers`.

### Requirement: Agent 4 clarification phase

**Reason**: Clarification conversations and private threads are deferred to a future change; post-intake Agent 4 is Legal Analysis only.

**Migration**: No migration; feature not yet implemented.

### Requirement: Resolution options publication

**Reason**: Resolution options and shared-room publication are deferred to a future change after post-intake analysis.

**Migration**: No migration; feature not yet implemented.

### Requirement: Intermediate outputs not shown in chat

**Reason**: Superseded by equivalent requirement in `post-intake-agents` spec.

**Migration**: Follow `post-intake-agents` agent outputs visibility rules.

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Post-intake pipeline supersedes situation-description pipeline

The dispute AI pipeline SHALL be the post-intake four-agent analysis model (psychodynamic profile, interests analysis, emotional triggers, legal analysis) triggered after both sides complete dispute intake, as specified in the `post-intake-agents` capability.

#### Scenario: Pipeline replaces archived agent model

- **WHEN** the dispute AI pipeline is referenced in application code or admin documentation
- **THEN** it refers to the post-intake four-agent model
- **AND** the archived legal-domain / precedents / compatibility / synthesis model is not used
