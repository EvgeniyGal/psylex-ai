# Mediation Agent

## Purpose

AI agent that orchestrates live mediation—opening presentation adapted per psychoprofile, structured dialogue moderation, solution-option generation, and compromise proposals after voting discrepancy.

## Requirements

### Requirement: Mediation agent prompt storage

The platform SHALL store an editable system prompt for the Mediation Agent keyed by `agent_key` `mediation` in the `agent_prompts` table.

#### Scenario: Prompt keyed mediation

- **WHEN** an admin opens the Mediation Agent prompt editor
- **THEN** the system loads the prompt with `agent_key` `mediation`
- **AND** saved changes are used on subsequent live and test invocations

### Requirement: Opening situation adaptation per party

When mediation begins, the Mediation Agent SHALL generate an opening presentation of the dispute situation for each party. The underlying factual content SHALL be identical for both parties. Presentation for each party SHALL be adapted using that party's `preferred_locale` and `psychodynamic_profile` (and `emotional_triggers` when relevant) so the information is framed in language and style that party can readily understand. Relevant post-intake outputs (`interests_analysis`, `legal_analysis`) inform substance only.

#### Scenario: Adapted opening for Side 1

- **WHEN** mediation phase transitions to `opening` after `mediation_started_at` is set
- **THEN** the agent generates an opening message with a canonical content payload and a Side 1–adapted rendering in Side 1's `preferred_locale` tuned to Side 1's psychodynamic profile
- **AND** Side 1 sees the adapted rendering in the shared room chat
- **AND** Side 2 does not see Side 1's adapted text

#### Scenario: Adapted opening for Side 2

- **WHEN** the opening phase runs for Side 2
- **THEN** the agent generates a Side 2–adapted rendering of the same canonical opening content in Side 2's `preferred_locale` tuned to Side 2's psychodynamic profile
- **AND** Side 2 sees their adapted rendering
- **AND** Side 1 does not see Side 2's adapted text

### Requirement: Structured dialogue questions

During dialogue rounds, the Mediation Agent SHALL ask structured questions to each party in turn, alternating sides within a round.

#### Scenario: Turn-based questioning

- **WHEN** a dialogue round is active and it is Side 1's turn
- **THEN** the agent posts a structured question addressed to Side 1 in the shared channel (with per-party rendering if adaptation applies)
- **AND** Side 2 sees that a question was asked to Side 1 but sees only neutral or self-relevant rendering as defined by adaptation rules
- **AND** the system records the active turn and expected respondent

### Requirement: Personal attack moderation

The Mediation Agent SHALL detect personal attacks in participant replies and block or rewrite them, redirecting the party to address the substantive dispute.

#### Scenario: Attack blocked

- **WHEN** a participant submits a reply containing a personal attack
- **THEN** the attack is not published as a normal participant message
- **AND** the agent responds with a redirect message asking the party to focus on substance
- **AND** the original attack text MAY be stored in moderation metadata for audit but SHALL NOT be shown to the other party

#### Scenario: Substantive reply accepted

- **WHEN** a participant submits a substantive reply during their turn
- **THEN** the message is stored in the shared channel
- **AND** the dialogue state advances to the next turn or round summary

### Requirement: Round summary after each dialogue round

After each dialogue round completes, the Mediation Agent SHALL post a summary of what was heard from both parties.

#### Scenario: End-of-round summary

- **WHEN** all turns in dialogue round N are complete
- **THEN** the agent posts a round summary message to the shared channel
- **AND** the summary reflects both parties' substantive contributions
- **AND** `mediation_round` increments or is marked complete for that round

### Requirement: Solution option generation

The Mediation Agent SHALL generate **2–3** solution options. Each option SHALL include: brief description (what each party gets), applicable legal norms (legal information, not advice), fulfillment-probability assessment informed by psychoprofiles, risks if the option is refused, and per-party presentation adaptations with identical substantive content. Each per-party presentation SHALL use that party's `preferred_locale` and psychodynamic profile.

#### Scenario: Options generated

- **WHEN** the room enters `generating_options`
- **THEN** the agent produces 2–3 structured option objects persisted on the room
- **AND** each option includes canonical fields plus per-side presentation fields localized and psychodynamically adapted for that side
- **AND** legal norms are sourced from `legal_analysis` and/or legal RAG, labeled as information not advice

#### Scenario: Per-party option display

- **WHEN** options are published to participants
- **THEN** each side sees their adapted presentation for every option
- **AND** neither side sees the other's adapted presentation text

### Requirement: Compromise option after voting discrepancy

When parties' first-round votes do not match, the Mediation Agent SHALL generate exactly one compromise option informed by both parties' selections and the prior option set.

#### Scenario: Compromise generated

- **WHEN** first-round voting ends in discrepancy
- **THEN** the agent generates one compromise option with the same field structure as other options
- **AND** each party sees the other's first-round choice before voting on the compromise
- **AND** only one compromise round is offered

### Requirement: Mediation agent input assembly

The Mediation Agent SHALL assemble input from the room's post-intake outputs: both sides' `psychodynamic_profile`, `emotional_triggers`, `preferred_locale`, dispute-intake answers, `interests_analysis`, `legal_analysis`, room `jurisdiction`, and prior mediation messages.

#### Scenario: Prerequisites enforced

- **WHEN** the mediation agent is invoked for a room
- **THEN** all post-intake agent outputs required by `canStartMediation` are included in assembly
- **AND** invocation fails with a logged error if prerequisites are missing
