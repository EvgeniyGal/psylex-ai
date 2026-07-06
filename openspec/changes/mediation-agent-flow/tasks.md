## 1. Database and schema

- [x] 1.1 Add Drizzle migration: `mediation_phase`, `mediation_round`, ready/vote/acceptance timestamps, `mediation_options`, `compromise_option`, `draft_agreement`, `selected_option_id`, `mediation_completed_at` on `rooms`
- [x] 1.2 Add `mediation_filing_receipts` table and `room_messages.canonical_content` / `room_messages.adaptations` columns
- [x] 1.3 Seed default `agent_prompts` row for `mediation` key; extend `AGENT_KEYS` and labels in `lib/pipeline/agent-keys.ts`
- [x] 1.4 Update `drizzle/schema.ts` with all new columns, enums, and relations

## 2. Mediation agent core

- [x] 2.1 Create `lib/pipeline/agents/mediation.ts` with structured output schemas for opening, dialogue turn, round summary, options, and compromise
- [x] 2.2 Create `lib/mediation/assemble-input.ts` to gather profiles, triggers, interests, legal analysis, dispute intake, and message history
- [x] 2.3 Implement opening adaptation generator (canonical + per-side presentations in each party's `preferred_locale` and psychodynamic style)
- [x] 2.4 Implement dialogue question generator, attack-moderation classifier/redirect, round summary generator, and reply-timeout nudge message
- [x] 2.5 Implement solution-option generator (2–3 options with legal norms, fulfillment probability, refusal risks, per-side presentation)
- [x] 2.6 Implement compromise-option generator for voting discrepancy path
- [x] 2.7 Implement data-sufficiency assessment helper invoked between dialogue turns

## 3. Mediation orchestrator and server actions

- [x] 3.1 Create `lib/mediation/orchestrator.ts` with phase state machine (`opening` → `dialogue` → `generating_options` → `voting` → `voting_discrepancy` → `agreement` → `completed`)
- [x] 3.2 Hook orchestrator start when handshake sets `mediation_started_at` (initialize `mediation_phase = opening`)
- [x] 3.3 Implement server actions: submit dialogue reply, click ready-for-options, cast vote, cast compromise vote, accept agreement
- [x] 3.4 Implement server-authoritative timers: session expiry from `mediation_started_at`, per-turn `current_turn_deadline_at` (2 min), nudge on first expiry then advance after second
- [x] 3.5 Implement transition rules: 3 rounds, both ready, timer expired, AI sufficiency
- [x] 3.6 Add `mediation_*` event logging to `pipeline_event_logs` or dedicated mediation events table
- [x] 3.7 Expose read API / server queries for room mediation state and viewer-resolved messages (no cross-side adaptation leakage)

## 4. Room messaging integration

- [x] 4.1 Extend message send/read paths to persist and resolve `canonical_content` + `adaptations` by viewer side
- [x] 4.2 Add `message_kind` values for mediation message types
- [x] 4.3 Implement turn tracking: which side may reply, block out-of-turn submissions

## 5. Participant UI (`/room`)

- [x] 5.1 Replace countdown-only placeholder with phase-aware mediation room layout
- [x] 5.2 Build opening phase view (adapted agent message display)
- [x] 5.3 Build dialogue phase: chat, turn indicator, 2-minute reply timer, ready-for-solutions button (always visible)
- [x] 5.4 Build options phase: option cards with per-party adapted presentation
- [x] 5.5 Build voting phase: blind independent selection UI
- [x] 5.6 Build discrepancy phase: reveal other party's choice + compromise option + second vote
- [x] 5.7 Build agreement phase: draft viewer, UPL disclaimer, dual I accept buttons
- [x] 5.8 Build completion phase: session completed message, filing receipt confirmation, download results button, email field + Send button (placeholder, no mail transport)
- [x] 5.9 Add polling for phase transitions (match handshake pattern)
- [x] 5.10 Add i18n strings (`en` / `uk`) for all mediation UI copy including UPL disclaimer

## 6. Agreement document and delivery

- [x] 6.1 Create agreement document template from `draft_agreement` JSON (structured content → renderable layout)
- [x] 6.2 Implement PDF generation module for download path
- [x] 6.3 Implement download server action returning PDF bytes
- [x] 6.4 Add email input + Send button UI only (disabled or "coming soon"; actual send deferred to follow-up)
- [x] 6.5 Persist filing receipt on mutual acceptance

## 7. Admin prompt management and testing

- [x] 7.1 Add Mediation Agent sub-tab to `agent-prompts-settings-content.tsx` (fifth tab) matching existing sub-tab layout (prompt editor, save, test selector, run test, output panel)
- [x] 7.2 Implement room selector listing `canStartMediation`-eligible rooms
- [x] 7.3 Implement `testMediationAgent` server action in simulation mode (supports unsaved draft prompt; no live room mutation)
- [x] 7.4 Display stepwise simulation output: inputs, opening sample, dialogue sample, options sample
- [x] 7.5 Update `agent-prompt-actions.ts` CRUD and save/load to include `mediation` key; live mediation uses saved prompt
- [x] 7.6 Update admin i18n for Mediation Agent labels and test panel copy
- [x] 7.7 Extend pipeline log UI to show `mediation` agent events alongside post-intake agents

## 8. Admin observability

- [x] 8.1 Show `mediation_phase`, round, and completion status on admin room detail page
- [x] 8.2 Link mediation events in room pipeline/event log view (Mediation Agent start/complete entries with `agent_key` `mediation`)

## 9. Integration and cleanup

- [x] 9.1 Update `mediation-handshake` countdown handler to invoke timer-expiry transitions instead of placeholder message
- [x] 9.2 Remove or disable legacy `post-resolution-dialogue` UI paths gated on `options_published`
- [x] 9.3 Backfill or guard existing rooms with `mediation_started_at` but no `mediation_phase`
- [ ] 9.4 Manual test: full flow with two participant sessions + admin prompt dry-run on same room data
