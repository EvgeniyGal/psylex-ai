# Agent Prompts Settings

## Purpose

Admin management of the four post-intake analysis agent system prompts and the Mediation Agent system prompt, with per-agent dry-run testing and pipeline log monitoring.

## Requirements

### Requirement: Prompts tab in Settings

The Settings page SHALL include a Prompts tab alongside the existing Credentials and Tests tabs. The Prompts tab SHALL host all agent prompt editing and testing UI.

#### Scenario: Prompts tab in Settings navigation

- **WHEN** an admin opens Settings
- **THEN** horizontal tabs for Credentials, Tests, and Prompts are visible
- **AND** selecting Prompts shows the agent prompt management UI

### Requirement: Four agent system prompts

The platform SHALL store editable system prompts for Agent 1 (Psychodynamic Profile), Agent 2 (Interests Analysis), Agent 3 (Emotional Triggers), Agent 4 (Legal Analysis), and the Mediation Agent. Post-intake prompts SHALL be keyed by `agent_key`: `psychodynamic`, `interests`, `emotional_triggers`, `legal_analysis`. The Mediation Agent SHALL be keyed `mediation`.

#### Scenario: Prompts stored per agent

- **WHEN** an admin opens Settings and selects the Prompts tab
- **THEN** five agent sub-tabs are displayed
- **AND** each sub-tab shows one editable system prompt field
- **AND** each prompt can be viewed and edited independently

### Requirement: Admin prompt editing

An admin SHALL be able to save changes to any agent system prompt, including the Mediation Agent. Saved prompts SHALL be used by the post-intake analysis pipeline and live mediation sessions on subsequent runs.

#### Scenario: Save prompt change

- **WHEN** an admin edits Agent 2's system prompt and saves
- **THEN** the updated prompt is persisted
- **AND** the next pipeline run for any room uses the updated Agent 2 prompt

#### Scenario: Save mediation prompt change

- **WHEN** an admin edits the Mediation Agent system prompt and saves
- **THEN** the updated prompt is persisted
- **AND** the next live mediation session uses the updated Mediation Agent prompt

### Requirement: Prompt testing

An admin SHALL be able to test prompt changes against real participant or room data and observe agent output without persisting results to live user or room records. This SHALL apply to all five agents including the Mediation Agent.

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

#### Scenario: Test mediation agent

- **WHEN** an admin selects a mediation-ready room and runs a test for the Mediation Agent
- **THEN** the system displays assembled room and party inputs
- **AND** invokes the Mediation Agent with the current (possibly unsaved draft) prompt in simulation mode
- **AND** displays simulated mediation output
- **AND** no live mediation state columns are updated on the room

### Requirement: Pipeline log monitoring

An admin SHALL be able to view room pipeline logs to validate agent execution, including post-intake agent stages and Mediation Agent invocations during live sessions, with timestamps and output summaries.

#### Scenario: Log reflects post-intake agent stages

- **WHEN** a room completes the post-intake pipeline
- **THEN** the log shows per-user agents (psychodynamic, emotional triggers) completing before room-level agents (interests, legal analysis)
- **AND** each agent start and completion is recorded with timestamp and room ID

#### Scenario: Log reflects mediation agent stages

- **WHEN** a room runs a live mediation session
- **THEN** the log shows Mediation Agent invocations (opening, dialogue, options, compromise as applicable)
- **AND** each invocation is recorded with `agent_key` `mediation`, timestamp, and room ID

### Requirement: Agent prompt sub-tabs

The Prompts tab SHALL display horizontal sub-tabs for each agent: Psychodynamic Profile, Interests Analysis, Emotional Triggers, Legal Analysis, and Mediation Agent.

#### Scenario: Sub-tab navigation includes mediation

- **WHEN** an admin opens the Prompts tab in Settings
- **THEN** five sub-tabs are visible within the Prompts panel
- **AND** selecting Mediation Agent shows that agent's prompt editor and room-based test panel

### Requirement: Test data selectors

Each agent test panel SHALL provide a selector appropriate to that agent's input requirements. The Mediation Agent test panel SHALL use a room selector.

#### Scenario: User selector for per-user agents

- **WHEN** an admin opens the test panel for Agent 1 or Agent 3
- **THEN** a dropdown lists users who meet that agent's prerequisites (personal bot prompt ready; dispute intake complete for Agent 3)
- **AND** selecting a user loads that user's input data for display

#### Scenario: Room selector for room-level agents

- **WHEN** an admin opens the test panel for Agent 2, Agent 4, or the Mediation Agent
- **THEN** a dropdown lists rooms meeting that agent's prerequisites
- **AND** selecting a room loads the relevant input data for display

### Requirement: Mediation agent parity with post-intake prompt UX

The Mediation Agent sub-tab SHALL provide the same admin capabilities as each post-intake agent sub-tab: view prompt, edit prompt, save prompt, select test data, run dry-run test, and view test output.

#### Scenario: Mediation sub-tab matches existing agent pattern

- **WHEN** an admin opens the Mediation Agent sub-tab
- **THEN** the layout matches the four post-intake agent sub-tabs (prompt textarea, save control, test data selector, run-test control, output panel)
- **AND** all controls are functional for the Mediation Agent
