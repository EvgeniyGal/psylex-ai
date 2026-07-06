# Mediation Agreement

## Purpose

Draft agreement document generation, dual-party acceptance, PDF delivery, mandatory UPL disclaimer, and filing receipt after successful mediation.

## ADDED Requirements

### Requirement: Draft agreement generation

When `mediation_phase` is `agreement`, the system SHALL generate a draft agreement document from the selected solution option and relevant session data (parties, option terms, legal information citations, timestamps).

#### Scenario: Draft produced on entry to agreement phase

- **WHEN** a matching vote or accepted compromise sets `selected_option_id`
- **THEN** the system generates draft agreement content (structured JSON plus renderable document body)
- **AND** both parties can view the draft in `/room`

### Requirement: Dual-party acceptance

Both parties SHALL confirm the draft via an **"I accept"** button (localized). The agreement is binding for session purposes only when both accept.

#### Scenario: First acceptance pending

- **WHEN** Side 1 clicks I accept
- **THEN** `side1_agreement_accepted_at` is set
- **AND** Side 2 sees that acceptance is pending from the other party

#### Scenario: Mutual acceptance

- **WHEN** both parties have clicked I accept
- **THEN** `agreement_finalized_at` is set
- **AND** the session proceeds to completion and filing receipt

### Requirement: PDF download of results

The system SHALL provide a control to download session results including the finalized agreement (when present) and a summary of mediation outcomes.

#### Scenario: Download available

- **WHEN** a participant is in `agreement` or `completed` phase
- **THEN** a download button generates a PDF from the stored agreement and session summary
- **AND** the PDF is returned to the requesting participant

### Requirement: Email delivery UI placeholder

The agreement completion UI SHALL include an email address field and **Send** button so parties can request email delivery of the agreement PDF. Actual mail transport SHALL be deferred to a later release; in v1 the control is visible but sending is not implemented.

#### Scenario: Send button placeholder in v1

- **WHEN** a participant enters an email and clicks Send before mail transport exists
- **THEN** the system does not send email
- **AND** a localized message indicates email delivery is coming soon or the action is unavailable
- **AND** the download button remains the working delivery path

## REMOVED Requirements

### Requirement: Email delivery of agreement PDF

**Reason**: Mail transport deferred; replaced by placeholder UI requirement above.

**Migration**: Implement mail transport in a follow-up change; wire Send button to the same PDF generator used for download.

### Requirement: UPL disclaimer

The agreement and completion UI SHALL display a mandatory UPL disclaimer: the agreement results from voluntary party choice; PsyLex provides legal information only and does not render legal services; parties should consult a licensed attorney to give the document legal force.

#### Scenario: Disclaimer visible before acceptance

- **WHEN** a participant views the draft agreement
- **THEN** the UPL disclaimer is shown and cannot be dismissed without scrolling past it on first view

#### Scenario: Disclaimer in PDF

- **WHEN** an agreement PDF is generated
- **THEN** the UPL disclaimer is included in the document footer or dedicated section

### Requirement: Filing receipt

On successful mutual acceptance, the system SHALL persist a filing receipt capturing room ID, selected option ID, acceptance timestamps, and document hash or version identifier.

#### Scenario: Receipt saved on completion

- **WHEN** both parties accept and `mediation_phase` becomes `completed`
- **THEN** a filing receipt row is created
- **AND** participants see a localized "Session completed · Filing receipt saved" message
