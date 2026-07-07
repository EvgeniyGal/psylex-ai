# Admin Dashboard

## ADDED Requirements

### Requirement: Mediation session observability on room detail

The admin dashboard SHALL show mediation session status on room detail views when `mediation_started_at` is set, including current `mediation_phase`, round number, vote outcome, and link to mediation-related event logs.

#### Scenario: Room detail shows mediation state

- **WHEN** an admin views a room where mediation has started
- **THEN** the room detail page shows `mediation_phase`, elapsed time, and completion status
- **AND** pipeline and mediation event logs are accessible from the same view

## MODIFIED Requirements

### Requirement: Settings placeholder

The Settings page SHALL retain existing configuration tabs and add functional **Prompts** and **RAG** tabs. The Prompts tab SHALL include five agent prompt editors including the Mediation Agent.

#### Scenario: Settings shows Credentials and Tests tabs

- **WHEN** an admin opens the Settings page
- **THEN** Credentials and Tests tabs remain available with their existing configuration forms

#### Scenario: Settings shows Prompts tab

- **WHEN** an admin selects the Prompts tab within Settings
- **THEN** editors for all five agent system prompts are displayed (four post-intake agents plus Mediation Agent)
- **AND** prompt testing actions are available on that tab including room-based mediation simulation

#### Scenario: Settings shows RAG tab

- **WHEN** an admin selects the RAG tab within Settings
- **THEN** the legal document management and test inquiry interface is displayed
- **AND** Credentials, Tests, and Prompts tabs remain accessible
