# Agent Prompts Settings

## Purpose

Admin management of the four dispute pipeline agent system prompts with testing and pipeline log monitoring.

## Requirements

### Requirement: Prompts tab in Settings

The Settings page SHALL include a Prompts tab alongside the existing Credentials and Tests tabs. The Prompts tab SHALL host all agent prompt editing and testing UI.

#### Scenario: Prompts tab in Settings navigation

- **WHEN** an admin opens Settings
- **THEN** horizontal tabs for Credentials, Tests, and Prompts are visible
- **AND** selecting Prompts shows the agent prompt management UI

### Requirement: Four agent system prompts

The platform SHALL store editable system prompts for Agent 1 (Legal Domain), Agent 2 (Precedents), Agent 3 (Compatibility), and Agent 4 (Synthesis & Resolution).

#### Scenario: Prompts stored per agent

- **WHEN** an admin opens Settings and selects the Prompts tab
- **THEN** four prompt fields are displayed, one per agent
- **AND** each prompt can be viewed and edited independently

### Requirement: Admin prompt editing

An admin SHALL be able to save changes to any agent system prompt. Saved prompts SHALL be used by the dispute AI pipeline on subsequent runs.

#### Scenario: Save prompt change

- **WHEN** an admin edits Agent 2's system prompt and saves
- **THEN** the updated prompt is persisted
- **AND** the next pipeline run for any room uses the updated Agent 2 prompt

### Requirement: Prompt testing

An admin SHALL be able to test prompt changes against sample inputs and observe agent behavior without affecting a live room session.

#### Scenario: Test prompt in isolation

- **WHEN** an admin runs a prompt test for Agent 1 with sample situation descriptions
- **THEN** the system invokes Agent 1 with the current (possibly unsaved draft) prompt and sample input
- **AND** the test output is displayed to the admin
- **AND** no live room pipeline state is modified

### Requirement: Pipeline log monitoring

An admin SHALL be able to view session/room pipeline logs to validate pipeline correctness, including agent stage transitions, timestamps, and stored output summaries.

#### Scenario: View room pipeline log

- **WHEN** an admin opens pipeline logs for a room
- **THEN** a chronological log of pipeline events is displayed (stage started, stage completed, clarification sent, options published, errors)
- **AND** each entry includes timestamp and relevant room ID

#### Scenario: Log reflects agent stages

- **WHEN** a room completes the full pipeline
- **THEN** the log shows Agent 1 completion before Agents 2/3, Agents 2/3 before Agent 4, and options publication
- **AND** jurisdiction clarification pauses are recorded if they occurred
