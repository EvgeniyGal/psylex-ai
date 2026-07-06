## Context

PsyLex currently gates mediation entry via post-intake agents (`psychodynamic`, `interests`, `emotional_triggers`, `legal_analysis`) and a mutual handshake (`mediation-handshake`). The `/room` route shows a 20-minute countdown with no mediation logic. Admin Settings already supports four agent prompts with dry-run testing (`agent-prompts-settings`).

This change introduces a fifth agent—the **Mediation Agent**—and a full session state machine from opening through agreement signing. It reuses existing patterns: `lib/pipeline/` agent modules, `agent_prompts` storage, `room_messages` persistence, and admin prompt test panels.

**Key constraints:**
- Both parties share one chat; adapted content must not leak across sides.
- Legal content is information only (UPL); disclaimers are mandatory.
- Admin test runs must not mutate live room mediation state.
- Session timer (20 min) and reply timer (2 min) must be server-authoritative.

## Goals / Non-Goals

**Goals:**
- Deliver end-to-end mediation: opening → dialogue (≤3 rounds) → options → voting → agreement → completion.
- Adapt presentation per psychoprofile while preserving identical substance.
- Provide admin prompt editing and room-based simulation testing for the Mediation Agent.
- Generate downloadable PDF; email send UI placeholder only in v1 (actual transport deferred).
- Integrate with existing post-intake outputs and legal RAG where options cite norms.

**Non-Goals:**
- Replacing or re-running post-intake agents during mediation.
- Real-time video/audio mediation or human mediator takeover UI (mediator role may observe later).
- Legally binding e-signature integrations (parties accept voluntarily; attorney consultation recommended).
- Multi-room or multi-party (>2) mediation.
- Rewriting the mediation lobby handshake flow.

## Decisions

### 1. Mediation orchestration module vs. extending post-intake pipeline

**Decision:** New `lib/mediation/` module (orchestrator, phase transitions, timers) separate from `lib/pipeline/` post-intake orchestrator. Mediation Agent invocations live in `lib/pipeline/agents/mediation.ts` but are called by the mediation orchestrator.

**Rationale:** Post-intake pipeline is a one-shot batch job; mediation is a long-running, interactive state machine with timers and participant actions. Mixing them increases coupling.

**Alternatives considered:**
- *Single pipeline module* — rejected; different lifecycle and triggers.
- *One monolithic mediation agent call* — rejected; phases need incremental persistence and UI updates.

### 2. Per-party adapted messages in shared channel

**Decision:** Store one `room_messages` row per agent utterance with `canonical_content` + `adaptations` JSONB (`{ side1: "...", side2: "..." }`). API layer resolves rendering based on authenticated viewer's side. Participant messages remain unadapted plain text in `content`.

**Rationale:** Single chronological stream for ordering; no duplicate rows; clear audit trail of canonical substance.

**Alternatives considered:**
- *Duplicate rows per side* — breaks ordering and complicates "shared chat" UX.
- *Private threads for adapted openings* — contradicts "shared chat" requirement.

### 3. Phase state on `rooms` table

**Decision:** Add `mediation_phase`, `mediation_round`, vote/ready/acceptance timestamps, and JSONB blobs (`mediation_options`, `draft_agreement`) directly on `rooms`. Filing receipts in `mediation_filing_receipts`.

**Rationale:** Matches existing pattern (`mediation_started_at`, post-intake columns on `rooms`). One room = one mediation session.

**Alternatives considered:**
- *Separate `mediation_sessions` table* — more normalized but adds joins; defer unless multi-session-per-room is needed.

### 4. Timer implementation

**Decision:** Server stores `mediation_started_at` and derives expiry; reply deadlines stored as `current_turn_deadline_at` on room or in mediation state JSON. Client polls or uses SSE every 1–2s for countdown sync. Server actions reject late replies.

**Rationale:** Prevents client clock manipulation; consistent with handshake polling pattern.

### 5. Ready-for-solutions transition

**Decision:** Require **both** parties to click (per user's detailed spec). Persist `side1_ready_for_options_at` / `side2_ready_for_options_at`. Either timestamp alone does not transition.

**Rationale:** User explicitly stated "when both sides click"; avoids one party forcing premature options.

### 6. Solution option generation

**Decision:** Single Mediation Agent invocation (structured JSON schema) produces 2–3 options after transition to `generating_options`. Input: interests, legal analysis, dialogue transcript, profiles. Legal norms pulled from persisted `legal_analysis` + optional RAG refresh via existing `lib/rag/agent-tool.ts`.

**Rationale:** One coherent option set; reuse Agent 4 output; structured output enables voting by `option_id`.

### 7. Voting and discrepancy flow

**Decision:** First vote: blind, stored on room. On mismatch → phase `voting_discrepancy`, reveal votes in UI, generate one compromise option, second vote (boolean accept/reject on compromise only). No third round.

**Rationale:** Matches user spec exactly; limits endless loops.

### 8. Agreement PDF generation

**Decision:** Two-step: (1) Mediation Agent or dedicated template step produces structured agreement JSON + markdown body; (2) server renders PDF via `@react-pdf/renderer` or `puppeteer`/`playwright` HTML-to-PDF (choose based on existing deps at implementation time). Include UPL disclaimer block in template.

**Rationale:** Separates content quality (AI) from layout (template). Download and email share the same generator.

**Alternatives considered:**
- *AI generates PDF bytes directly* — unreliable formatting.

### 9. Admin simulation mode

**Decision:** `testMediationAgent(roomId, draftPrompt)` server action runs agent steps in memory (or writes to `mediation_test_runs` ephemeral table) without updating live `mediation_phase` or votes. Returns streamed or stepwise JSON for admin UI. The Mediation Agent sub-tab reuses the same component patterns as the four post-intake agents (prompt editor, save, selector, run test, output panel).

**Rationale:** Mirrors existing post-intake agent test pattern in `agent-prompt-actions.ts`; one new `agent_key`, not a separate admin surface.

**Note:** This change adds **one** prompt-managed agent (`mediation`). Opening, dialogue, options, and compromise are invocation modes of that agent—not separate prompt tabs. Agreement PDF generation uses a document template, not an `agent_prompts` entry.

### 10. Trigger point

**Decision:** On successful handshake when `mediation_started_at` is set, server initializes `mediation_phase = 'opening'` and enqueues opening generation (sync or background job). If background, room polls until opening messages appear.

**Rationale:** Handshake already redirects to `/room`; opening is first visible action.

### 11. Per-party adaptation: locale + psychodynamic profile

**Decision:** Every adapted agent message (opening, questions, summaries, options) is generated **per party** using two inputs: that party's `preferred_locale` (`en` / `uk`) and their `psychodynamic_profile` (plus `emotional_triggers` when relevant). Canonical substance stays identical; each party sees content in their language, framed in a way they can absorb given their psychodynamic characteristics.

**Rationale:** Legal and emotional information must be understandable to each party—not just translated, but presented in a register and structure suited to how that person processes conflict.

**Implementation note:** `adaptations` JSONB keys by side; each value is already locale-appropriate text produced by the agent for that party's locale + profile.

### 12. Reply timeout policy: single wait

**Decision:** When the 2-minute reply timer expires without a submission, the turn times out immediately and dialogue advances (next party question or round summary). No nudge or second deadline.

**Rationale:** Product request — one question, one 2-minute window per turn.

### 13. Email delivery deferred

**Decision:** v1 shows email input + **Send** button in the agreement/completion UI but does **not** wire mail transport. Clicking Send shows a localized "coming soon" or disabled state; PDF download is the working delivery path.

**Rationale:** User requested email in a follow-up step; button reserves UX space.

### 14. Mediator visibility (not applicable in v1)

**Decision:** No mediator view of live adapted messages in v1. The open question referred to whether a human **mediator** role (if they could open the room) would see each party's personalized text or only neutral canonical content. Participant-only `/room` is in scope; mediator observation UI is out of scope. If added later, default to **canonical content only** so mediators remain impartial and do not see psychologically tailored framing.

## Risks / Trade-offs

- **[Risk] Adaptation leakage via API** → Mitigation: resolve adaptations only in server components/actions; never return both sides' text in one response; integration tests per side.
- **[Risk] 20-minute timer vs. slow AI** → Mitigation: transition to `generating_options` even if mid-round; show clear UX when time expires.
- **[Risk] Long agent calls block dialogue** → Mitigation: async job queue for option generation and compromise; loading states in UI.
- **[Risk] PDF deliverability** → Mitigation: download always works in v1; email button is placeholder until transport is added.
- **[Risk] UPL compliance** → Mitigation: fixed disclaimer strings in i18n; included in UI and PDF; legal norms labeled "information not advice."
- **[Trade-off] Polling vs. WebSockets** → Polling matches existing handshake pattern; slightly higher latency acceptable for MVP.

## Migration Plan

1. Deploy Drizzle migration: mediation columns, `mediation_filing_receipts`, message adaptation columns, seed `mediation` prompt.
2. Deploy backend: mediation orchestrator + agent module (feature-flagged or inactive until UI ready).
3. Deploy admin Prompts tab extension (mediation sub-tab + test panel).
4. Deploy `/room` UI phase components; replace countdown-only placeholder.
5. Existing rooms with `mediation_started_at` but no phase: backfill `mediation_phase = 'completed'` or reset via admin tool.

**Rollback:** Revert UI to countdown placeholder; migration columns are additive and nullable—no data loss.

## Resolved decisions (product input)

| Topic | Decision |
|-------|----------|
| Email transport | Deferred; v1 shows Send button only, no mail integration |
| Reply timeout | Single 2-minute wait per question; advance turn if no reply (no nudge) |
| Adaptation | Per party: `preferred_locale` + `psychodynamic_profile` (digestible framing for that party) |
| Mediator visibility | N/A in v1; future mediator views use canonical content only |
