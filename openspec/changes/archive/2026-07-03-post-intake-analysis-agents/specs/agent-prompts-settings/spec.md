## MODIFIED Requirements

### Requirement: Four agent system prompts

The platform SHALL store editable system prompts for Agent 1 (Psychodynamic Profile), Agent 2 (Interests Analysis), Agent 3 (Emotional Triggers), and Agent 4 (Legal Analysis). Each prompt SHALL be keyed by `agent_key`: `psychodynamic`, `interests`, `emotional_triggers`, `legal_analysis`.

#### Scenario: Prompts stored per agent

- **WHEN** an admin opens Settings and selects the Prompts tab
- **THEN** four agent sub-tabs are displayed
- **AND** each sub-tab shows one editable system prompt field
- **AND** each prompt can be viewed and edited independently

### Requirement: Prompt testing

An admin SHALL be able to test prompt changes against real participant data and observe agent output without persisting results to live user or room records.

#### Scenario: Test psychodynamic agent

- **WHEN** an admin selects a user with a ready `personal_bot_prompt` and runs a test for Agent 1
- **THEN** the system displays the personal bot prompt as input
- **AND** invokes Agent 1 with the current (possibly unsaved draft) prompt
- **AND** displays the generated psychodynamic profile
- **AND** no `psychodynamic_profile` column is updated on the live user record

#### Scenario: Test interests agent

- **WHEN** an admin selects a room where both sides have completed dispute intake and runs a test for Agent 2
- **THEN** the system displays both sides' dispute-intake answers as input
- **AND** invokes Agent 2 with the current prompt
- **AND** displays the generated interests analysis
- **AND** no `interests_analysis` column is updated on the live room record

#### Scenario: Test emotional triggers agent

- **WHEN** an admin selects a user with a ready personal bot prompt and completed dispute intake and runs a test for Agent 3
- **THEN** the system displays the personal bot prompt and dispute-intake answers as input
- **AND** invokes Agent 3 with the current prompt
- **AND** displays the generated emotional triggers
- **AND** no `emotional_triggers` column is updated on the live user record

#### Scenario: Test legal analysis agent

- **WHEN** an admin selects a room where both sides have completed dispute intake and runs a test for Agent 4
- **THEN** the system displays both sides' dispute-intake answers and the room jurisdiction as input
- **AND** invokes Agent 4 with RAG retrieval and the current prompt
- **AND** displays the generated legal analysis with citations
- **AND** no `legal_analysis` column is updated on the live room record

### Requirement: Pipeline log monitoring

An admin SHALL be able to view room pipeline logs to validate post-intake agent execution, including agent stage transitions, timestamps, and stored output summaries.

#### Scenario: Log reflects post-intake agent stages

- **WHEN** a room completes the post-intake pipeline
- **THEN** the log shows per-user agents (psychodynamic, emotional triggers) completing before room-level agents (interests, legal analysis)
- **AND** each agent start and completion is recorded with timestamp and room ID

## ADDED Requirements

### Requirement: Agent prompt sub-tabs

The Prompts tab SHALL display horizontal sub-tabs for each of the four post-intake agents: Psychodynamic Profile, Interests Analysis, Emotional Triggers, and Legal Analysis.

#### Scenario: Sub-tab navigation

- **WHEN** an admin opens the Prompts tab in Settings
- **THEN** four sub-tabs are visible within the Prompts panel
- **AND** selecting a sub-tab shows that agent's prompt editor and test panel

### Requirement: Test data selectors

Each agent test panel SHALL provide a selector appropriate to that agent's input requirements.

#### Scenario: User selector for per-user agents

- **WHEN** an admin opens the test panel for Agent 1 or Agent 3
- **THEN** a dropdown lists users who meet that agent's prerequisites (personal bot prompt ready; dispute intake complete for Agent 3)
- **AND** selecting a user loads that user's input data for display

#### Scenario: Room selector for room-level agents

- **WHEN** an admin opens the test panel for Agent 2 or Agent 4
- **THEN** a dropdown lists rooms where both sides have completed dispute intake
- **AND** selecting a room loads both sides' dispute-intake answers for display
