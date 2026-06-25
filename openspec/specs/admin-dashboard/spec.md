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

The admin dashboard SHALL provide tab navigation with three tabs: Settings, Sessions, and Mediators.

#### Scenario: Tab switching

- **WHEN** an admin clicks the Sessions tab
- **THEN** the Sessions content area is displayed
- **AND** the Sessions tab is visually active

#### Scenario: Default tab

- **WHEN** an admin opens the dashboard without a specific tab selected
- **THEN** the Sessions tab is shown by default

### Requirement: Settings placeholder

The Settings tab SHALL display a placeholder page for future application settings.

#### Scenario: Settings placeholder content

- **WHEN** an admin opens the Settings tab
- **THEN** a placeholder message indicates settings are not yet available

### Requirement: Stitch-aligned admin UI

The admin dashboard UI SHALL follow Stitch design references for Settings, Sessions, and Mediators screens.

#### Scenario: Admin visual consistency

- **WHEN** any admin tab is rendered
- **THEN** layout, navigation, and styling match the cached Stitch admin screen assets in `docs/stitch/`
