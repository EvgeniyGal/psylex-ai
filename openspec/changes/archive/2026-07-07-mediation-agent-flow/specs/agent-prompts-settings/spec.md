# Agent Prompts Settings

## ADDED Requirements

### Requirement: Mediation agent system prompt

The platform SHALL store an editable system prompt for the Mediation Agent keyed by `agent_key` `mediation` alongside the four post-intake agents.

#### Scenario: Fifth agent sub-tab

- **WHEN** an admin opens Settings and selects the Prompts tab
- **THEN** five agent sub-tabs are displayed including Mediation Agent
- **AND** the Mediation Agent sub-tab shows one editable system prompt field

### Requirement: Mediation agent prompt testing with room selector

An admin SHALL be able to test the Mediation Agent prompt against real room data and simulate the mediation flow without persisting results to live room records or advancing live `mediation_phase`. Testing SHALL support the current **draft** prompt before save, matching the four post-intake agents.

#### Scenario: Test mediation agent

- **WHEN** an admin selects a room where both sides have completed post-intake pipeline and runs a mediation test
- **THEN** the system displays assembled inputs (profiles, interests, legal analysis, dispute answers, locales)
- **AND** invokes the Mediation Agent with the current (possibly unsaved draft) prompt in simulation mode
- **AND** displays phase-by-phase simulated output (opening, sample dialogue turn, sample options)
- **AND** no live `mediation_phase`, votes, or agreement columns are updated on the room

#### Scenario: Room selector for mediation agent

- **WHEN** an admin opens the test panel for the Mediation Agent
- **THEN** a dropdown lists rooms where `canStartMediation` prerequisites are met
- **AND** selecting a room loads that room's post-intake data for display

### Requirement: Mediation agent prompt save and live use

An admin SHALL be able to save changes to the Mediation Agent system prompt. Saved prompts SHALL be used by live mediation sessions on subsequent invocations.

#### Scenario: Save mediation prompt change

- **WHEN** an admin edits the Mediation Agent system prompt and saves
- **THEN** the updated prompt is persisted with `agent_key` `mediation`
- **AND** the next live mediation run for any room uses the updated prompt

### Requirement: Mediation agent parity with post-intake prompt UX

The Mediation Agent sub-tab SHALL provide the same admin capabilities as each post-intake agent sub-tab: view prompt, edit prompt, save prompt, select test data, run dry-run test, and view test output.

#### Scenario: Mediation sub-tab matches existing agent pattern

- **WHEN** an admin opens the Mediation Agent sub-tab
- **THEN** the layout matches the four post-intake agent sub-tabs (prompt textarea, save control, test data selector, run-test control, output panel)
- **AND** all controls are functional for the Mediation Agent

### Requirement: Agent prompt sub-tabs

The Prompts tab SHALL display horizontal sub-tabs for each agent: Psychodynamic Profile, Interests Analysis, Emotional Triggers, Legal Analysis, and Mediation Agent.

#### Scenario: Sub-tab navigation includes mediation

- **WHEN** an admin opens the Prompts tab in Settings
- **THEN** five sub-tabs are visible within the Prompts panel
- **AND** selecting Mediation Agent shows that agent's prompt editor and room-based test panel

## MODIFIED Requirements

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

### Requirement: Test data selectors

Each agent test panel SHALL provide a selector appropriate to that agent's input requirements. The Mediation Agent test panel SHALL use a room selector.

#### Scenario: Room selector for room-level agents

- **WHEN** an admin opens the test panel for Agent 2, Agent 4, or the Mediation Agent
- **THEN** a dropdown lists rooms meeting that agent's prerequisites
- **AND** selecting a room loads the relevant input data for display
