# Admin Dashboard

## MODIFIED Requirements

### Requirement: Settings placeholder

The Settings page SHALL retain existing configuration tabs and add a **Prompts** tab for agent prompt management. The Settings placeholder is fully replaced by functional settings tabs.

#### Scenario: Settings shows Credentials and Tests tabs

- **WHEN** an admin opens the Settings page
- **THEN** Credentials and Tests tabs remain available with their existing configuration forms

#### Scenario: Settings shows Prompts tab

- **WHEN** an admin selects the Prompts tab within Settings
- **THEN** editors for all four agent system prompts are displayed
- **AND** prompt testing actions are available on that tab

### Requirement: Tab navigation

The admin dashboard SHALL provide sidebar navigation with four items: Rooms, Mediators, and Settings. The Settings page SHALL provide horizontal tab navigation with three tabs: Credentials, Tests, and Prompts.

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
- **AND** Credentials and Tests tabs remain accessible

## ADDED Requirements

### Requirement: Room pipeline log access

The admin dashboard SHALL provide access to per-room pipeline logs from room detail views.

#### Scenario: Admin views pipeline log from room

- **WHEN** an admin views a room's detail page
- **THEN** a link or section to the room's pipeline log is available
- **AND** the log shows agent stage progression and key events
