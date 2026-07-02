## MODIFIED Requirements

### Requirement: Tab navigation

The admin dashboard SHALL provide sidebar navigation with Rooms, Mediators, and Settings. The Settings page SHALL provide horizontal tab navigation with four tabs: Credentials, Tests, Prompts, and RAG.

#### Scenario: Sidebar tab switching

- **WHEN** an admin clicks the Rooms item in the sidebar
- **THEN** the Rooms content area is displayed
- **AND** the Rooms item is visually active

#### Scenario: Default sidebar item

- **WHEN** an admin opens the dashboard without a specific route selected
- **THEN** the Rooms page is shown by default

#### Scenario: Settings internal tab switching

- **WHEN** an admin opens Settings and clicks the Prompts tab
- **THEN** the Prompts content is displayed
- **AND** the Prompts tab is visually active
- **AND** Credentials, Tests, and RAG tabs remain accessible

#### Scenario: RAG settings tab navigation

- **WHEN** an admin opens Settings and clicks the RAG tab
- **THEN** the RAG management interface is displayed within the Settings page at `/admin/settings`
- **AND** the RAG tab is visually active
- **AND** Credentials, Tests, and Prompts tabs remain accessible

### Requirement: Settings placeholder

The Settings page SHALL retain existing configuration tabs and add functional **Prompts** and **RAG** tabs. The Settings placeholder is fully replaced by functional settings tabs.

#### Scenario: Settings shows Credentials and Tests tabs

- **WHEN** an admin opens the Settings page
- **THEN** Credentials and Tests tabs remain available with their existing configuration forms

#### Scenario: Settings shows Prompts tab

- **WHEN** an admin selects the Prompts tab within Settings
- **THEN** editors for all four agent system prompts are displayed
- **AND** prompt testing actions are available on that tab

#### Scenario: Settings shows RAG tab

- **WHEN** an admin selects the RAG tab within Settings
- **THEN** the legal document management and test inquiry interface is displayed
- **AND** Credentials, Tests, and Prompts tabs remain accessible
