# Dispute AI Pipeline

## Purpose

Four-agent orchestrated analysis pipeline that runs after all sides submit situation descriptions, producing resolution options via Agent 4.

## Requirements

### Requirement: Pipeline execution order

The dispute AI pipeline SHALL execute agents in this order: Agent 1 (Legal Domain) first; Agents 2 (Precedents) and 3 (Compatibility) in parallel after Agent 1 completes; Agent 4 (Synthesis & Resolution) after both Agents 2 and 3 complete.

#### Scenario: Sequential and parallel stages

- **WHEN** the pipeline is triggered for a room
- **THEN** Agent 1 runs first and must complete before Agents 2 or 3 start
- **AND** Agents 2 and 3 run concurrently after Agent 1 output is stored
- **AND** Agent 4 runs only after both Agent 2 and Agent 3 outputs are stored

### Requirement: Automatic psychological profile input

Each agent that requires psychological data SHALL receive the submitting side's psychological profile automatically from onboarding — derived from completed tests and `personalBotPrompt` — without manual re-entry by the participant.

#### Scenario: Profile pulled for Agent 3

- **WHEN** Agent 3 (Compatibility) runs for a room with Side 1 and Side 2
- **THEN** the system loads psychological profiles for both sides from stored onboarding data
- **AND** no participant input is required to supply profile data

### Requirement: Agent 1 legal domain classification

Agent 1 SHALL determine the area of law, jurisdiction, and applicable legal norms for the dispute. Output SHALL be stored as `legal_domain`, `jurisdiction`, and `applicable_norms` on the room pipeline record.

#### Scenario: Jurisdiction present

- **WHEN** Agent 1 can determine jurisdiction from situation descriptions
- **THEN** `legal_domain`, `jurisdiction`, and `applicable_norms` are persisted
- **AND** Agents 2 and 3 are eligible to start

#### Scenario: Jurisdiction missing

- **WHEN** Agent 1 cannot determine jurisdiction from available data
- **THEN** Agent 1 sends a jurisdiction question to all sides via their private threads
- **AND** the pipeline pauses at Agent 1 until all required responses are received
- **AND** Agent 1 finalizes and stores output after responses are collected

### Requirement: Agent 2 precedent research

Agent 2 SHALL research relevant case law and judicial precedents for the classified legal domain using RAG, legal APIs, or configured external databases. Output SHALL be stored as `case_law_results` on the room pipeline record.

#### Scenario: Precedent research completes

- **WHEN** Agent 2 runs after Agent 1 completes
- **THEN** `case_law_results` is persisted on the room pipeline record
- **AND** the result is not displayed in the shared room chat

### Requirement: Agent 3 compatibility analysis

Agent 3 SHALL analyze psychological profiles of all sides, assessing compatibility, friction points, and areas of common ground. Output SHALL be stored as `compatibility_analysis` on the room pipeline record.

#### Scenario: Compatibility analysis completes

- **WHEN** Agent 3 runs after Agent 1 completes
- **THEN** `compatibility_analysis` is persisted on the room pipeline record
- **AND** the result is not displayed in the shared room chat

### Requirement: Agent 4 clarification phase

Agent 4 SHALL conduct independent clarification conversations with each side via private threads. Each side's clarification SHALL be tracked separately (`clarification_complete_s1`, `clarification_complete_s2`, extensible per side). Agent 4 SHALL ask questions, wait for responses, and ask follow-ups until all required information is collected.

#### Scenario: Independent clarification threads

- **WHEN** Agent 4 needs clarification from Side 1 and Side 2
- **THEN** questions are sent to each side's private thread independently
- **AND** Side 1 answering does not block or affect Side 2's clarification thread

#### Scenario: Clarification completion per side

- **WHEN** Agent 4 has collected all required information from Side 1
- **THEN** `clarification_complete_s1` is set to true
- **AND** Side 2's clarification may still be in progress

### Requirement: Resolution options publication

Agent 4 SHALL generate exactly three resolution options designed to satisfy all sides and publish them to the shared room chat only when every side's clarification is marked complete.

#### Scenario: Options published when all clarifications done

- **WHEN** `clarification_complete_s1` and `clarification_complete_s2` (and equivalents for additional sides) are all true
- **THEN** Agent 4 generates three resolution options
- **AND** all three options are published simultaneously to the shared room chat visible to all sides
- **AND** each side sees option text in their `preferred_locale` (bilingual storage when locales differ)
- **AND** the room pipeline state transitions to `options_published`

### Requirement: Intermediate outputs not shown in chat

Agent outputs from Agents 1, 2, and 3 and in-progress Agent 4 work SHALL be stored on the room pipeline record and MUST NOT be displayed in the shared room chat until Agent 4 publishes the three resolution options.

#### Scenario: Hidden intermediate results

- **WHEN** Agents 1, 2, or 3 complete
- **THEN** their outputs are persisted in the database
- **AND** no agent output from those stages appears in the shared room chat
