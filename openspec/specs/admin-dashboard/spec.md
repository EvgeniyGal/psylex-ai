# Admin Dashboard

## Purpose

TBD — Admin interface for managing sessions, mediators, and application settings.

## Requirements

### Requirement: Admin-only access

The admin dashboard SHALL be accessible only to users with the `admin` role.

#### Scenario: Admin access granted

- **WHEN** a logged-in user with role `admin` navigates to the dashboard
- **THEN** the dashboard shell is displayed

#### Scenario: Non-admin denied

- **WHEN** a logged-in user with role other than `admin` navigates to the dashboard
- **THEN** access is denied or the user is redirected

### Requirement: Tab navigation

The admin dashboard SHALL provide sidebar navigation with Rooms, Mediators, and Settings. The Settings page SHALL provide horizontal tab navigation with three tabs: Credentials, Tests, and Prompts.

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

### Requirement: Settings placeholder

The Settings page SHALL retain existing configuration tabs and add a **Prompts** tab for agent prompt management. The Settings placeholder is fully replaced by functional settings tabs.

#### Scenario: Settings shows Credentials and Tests tabs

- **WHEN** an admin opens the Settings page
- **THEN** Credentials and Tests tabs remain available with their existing configuration forms

#### Scenario: Settings shows Prompts tab

- **WHEN** an admin selects the Prompts tab within Settings
- **THEN** editors for all four agent system prompts are displayed
- **AND** prompt testing actions are available on that tab

### Requirement: Room pipeline log access

The admin dashboard SHALL provide access to per-room pipeline logs from room detail views.

#### Scenario: Admin views pipeline log from room

- **WHEN** an admin views a room's detail page
- **THEN** a link or section to the room's pipeline log is available
- **AND** the log shows agent stage progression and key events

### Requirement: Stitch-aligned admin UI

The admin dashboard UI SHALL follow Stitch design references for Settings, Sessions, and Mediators screens.

#### Scenario: Admin visual consistency

- **WHEN** any admin tab is rendered
- **THEN** layout, navigation, and styling match the cached Stitch admin screen assets in `docs/stitch/`
