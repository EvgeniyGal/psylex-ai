# Mediation Handshake

## MODIFIED Requirements

### Requirement: 20-minute mediation countdown

The mediation room SHALL display a countdown timer showing remaining session time, defaulting to **20 minutes** from `mediation_started_at`. When the timer reaches zero during an active mediation session, the system SHALL apply mediation session flow transition rules (advance to solution-option generation or close the current phase per `mediation-session-flow`) rather than showing only a placeholder message.

#### Scenario: Countdown visible at start

- **WHEN** a participant enters `/room` immediately after mediation starts
- **THEN** the countdown shows approximately 20:00 remaining

#### Scenario: Countdown decrements

- **WHEN** time passes during an active mediation session
- **THEN** the displayed countdown decreases each second

#### Scenario: Countdown reaches zero

- **WHEN** the countdown reaches 00:00 during `opening`, `dialogue`, or `generating_options`
- **THEN** the mediation session flow timer-expiry transition runs
- **AND** participants see a localized notice that the dialogue time has ended
- **AND** the session continues into solution options or voting per current phase rules
