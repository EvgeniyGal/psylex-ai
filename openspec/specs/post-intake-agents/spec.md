# Post-Intake Agents

## Purpose

Four-agent post-intake analysis pipeline — trigger gate, orchestration, per-agent input assembly, OpenAI invocation, structured output validation, and persistence to `users` / `rooms`.

## Requirements

### Requirement: Post-intake pipeline gate

The system SHALL NOT run the post-intake analysis pipeline for a room until every side participant in that room has a non-null `dispute_intake_submitted_at` timestamp and a ready personal bot prompt (`personal_bot_ready_at` set with non-empty `personal_bot_prompt`).

#### Scenario: Pipeline waits for both sides

- **WHEN** Side 1 has submitted dispute intake but Side 2 has not
- **THEN** no post-intake agents are invoked for the room
- **AND** no room-level analysis outputs are written

#### Scenario: Pipeline triggers on last side submission

- **WHEN** the final side in a room submits dispute intake and both sides have ready personal bot prompts
- **THEN** the post-intake analysis pipeline is triggered automatically for that room
- **AND** a `pipeline_triggered` event is logged

### Requirement: Agent 1 psychodynamic profile

Agent 1 (Psychodynamic Profile) SHALL read a side's `personal_bot_prompt` and generate a structured psychodynamic profile. Output SHALL be persisted on that user's `users` record as `psychodynamic_profile` with `psychodynamic_profile_at` set to the completion time.

#### Scenario: Profile generated from personal bot prompt

- **WHEN** Agent 1 runs for a user with a non-empty `personal_bot_prompt`
- **THEN** `psychodynamic_profile` is persisted as structured JSON on the user record
- **AND** `psychodynamic_profile_at` is set
- **AND** the personal bot prompt text is the sole psychological input to the agent

#### Scenario: Profile skipped when prompt missing

- **WHEN** Agent 1 is invoked for a user without a ready personal bot prompt
- **THEN** Agent 1 does not write a profile
- **AND** an `agent_failed` event is logged with the reason

### Requirement: Agent 2 interests analysis

Agent 2 (Interests Analysis) SHALL read both sides' dispute-intake answers (`dispute_description`, `dispute_priority`, `dispute_acceptable_outcome`) and identify conflicting interests and areas of common ground. Output SHALL be persisted on the room's `rooms` record as `interests_analysis` with `interests_analysis_at` set.

#### Scenario: Interests analysis from both sides

- **WHEN** Agent 2 runs for a room where both sides have completed dispute intake
- **THEN** `interests_analysis` is persisted as structured JSON including conflicting interests and common ground
- **AND** `interests_analysis_at` is set
- **AND** both sides' three dispute-intake answers are included as input

#### Scenario: Interests analysis includes psychodynamic context when available

- **WHEN** Agent 2 runs and both sides have `psychodynamic_profile` stored
- **THEN** Agent 2 MAY include psychodynamic profiles as supplementary input
- **AND** dispute-intake answers remain the primary input source

### Requirement: Agent 3 emotional triggers

Agent 3 (Emotional Triggers) SHALL read a side's `personal_bot_prompt` and that side's dispute-intake answers, then determine emotional triggers for that side. Output SHALL be persisted on the user's `users` record as `emotional_triggers` with `emotional_triggers_at` set.

#### Scenario: Triggers generated from prompt and dispute answers

- **WHEN** Agent 3 runs for a user with a ready personal bot prompt and completed dispute intake
- **THEN** `emotional_triggers` is persisted as structured JSON on the user record
- **AND** `emotional_triggers_at` is set
- **AND** input includes both `personal_bot_prompt` and all three dispute-intake fields

### Requirement: Agent 4 legal analysis with RAG

Agent 4 (Legal Analysis) SHALL read both sides' dispute-intake answers and the room's `jurisdiction`, retrieve relevant legal excerpts from the local legal RAG corpus, and generate a legal analysis including applicable laws and regulations with citations. Output SHALL be persisted on the room's `rooms` record as `legal_analysis` with `legal_analysis_at` set.

#### Scenario: Legal analysis with RAG retrieval

- **WHEN** Agent 4 runs for a room with jurisdiction `ukraine` or `usa` and both sides have completed dispute intake
- **THEN** the system queries the legal RAG corpus scoped to the room's jurisdiction
- **AND** `legal_analysis` is persisted as structured JSON including applicable laws, regulations, analysis text, and citations
- **AND** `legal_analysis_at` is set

#### Scenario: RAG corpus empty

- **WHEN** Agent 4 runs and no documents exist for the room's jurisdiction
- **THEN** Agent 4 completes with an analysis noting insufficient corpus data
- **AND** the pipeline does not fail solely due to an empty corpus

#### Scenario: Citations grounded in retrieved excerpts

- **WHEN** Agent 4 cites a law or regulation
- **THEN** each citation references a document from the retrieved RAG excerpts
- **AND** the agent does not invent legal sources not present in retrieved excerpts

### Requirement: Pipeline execution order

The post-intake analysis pipeline SHALL execute per-user agents (Agent 1 and Agent 3) for each side in parallel, then execute room-level agents (Agent 2 and Agent 4) in parallel after all per-user agents for both sides complete.

#### Scenario: Per-user then room-level stages

- **WHEN** the pipeline is triggered for a room with Side 1 and Side 2
- **THEN** Agent 1 and Agent 3 run for Side 1 and Side 2 concurrently
- **AND** Agent 2 and Agent 4 start only after all four per-user agent runs complete
- **AND** Agent 2 and Agent 4 run concurrently with each other

### Requirement: Agent outputs not shown to participants

Agent outputs from the post-intake pipeline SHALL be stored in the database and MUST NOT be displayed in the participant room UI until a future feature explicitly exposes them.

#### Scenario: Silent storage

- **WHEN** any post-intake agent completes
- **THEN** its output is persisted on the appropriate user or room record
- **AND** no agent output appears in the participant-facing room experience

### Requirement: Idempotent agent execution

Each agent SHALL skip execution when its output already exists for the target user or room unless an explicit re-run is requested.

#### Scenario: Skip completed agent

- **WHEN** the pipeline is triggered and `psychodynamic_profile_at` is already set for a user
- **THEN** Agent 1 does not re-run for that user
- **AND** the pipeline proceeds to remaining incomplete agents

### Requirement: Mediation start gated on pipeline completion

The system SHALL NOT allow a participant to start mediation until the post-intake analysis pipeline has completed for their room. Completion means all four agent types have persisted outputs: psychodynamic profile and emotional triggers for each side, plus interests analysis and legal analysis on the room.

#### Scenario: Start Mediation disabled while agents run

- **WHEN** both sides are mediation-ready (`bothReady`) but the post-intake pipeline has not completed
- **THEN** the Start Mediation button is disabled on the mediation lobby for both sides
- **AND** a message informs participants that agents are analyzing the dispute and they should wait several minutes

#### Scenario: Start Mediation enabled after pipeline completes

- **WHEN** both sides are mediation-ready and all post-intake agent outputs are persisted
- **THEN** the Start Mediation button is enabled
- **AND** `rooms.post_intake_pipeline_completed_at` is set

#### Scenario: Server rejects premature mediation start

- **WHEN** a participant invokes `startMediation` while the post-intake pipeline is incomplete
- **THEN** the server does not redirect to `/room`
- **AND** the participant remains on the mediation lobby

### Requirement: Mediation lobby pipeline status polling

While the post-intake pipeline is in progress, the mediation lobby SHALL periodically refresh pipeline status so the Start Mediation button becomes available without a manual page reload.

#### Scenario: Auto-refresh while waiting

- **WHEN** a participant views the mediation lobby and `bothReady` is true but the pipeline is incomplete
- **THEN** the page polls for updated pipeline status at a regular interval
- **AND** the Start Mediation button enables automatically once the pipeline completes
