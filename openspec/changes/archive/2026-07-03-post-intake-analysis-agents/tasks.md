## 1. Database schema and migrations

- [x] 1.1 Add `agent_prompts` table to `drizzle/schema.ts` with `agent_key`, `system_prompt`, `updated_at`
- [x] 1.2 Add user columns: `psychodynamic_profile`, `psychodynamic_profile_at`, `emotional_triggers`, `emotional_triggers_at`
- [x] 1.3 Add room columns: `interests_analysis`, `interests_analysis_at`, `legal_analysis`, `legal_analysis_at`, `post_intake_pipeline_started_at`, `post_intake_pipeline_completed_at`
- [x] 1.4 Add `pipeline_event_logs` table with `room_id`, `user_id`, `agent_key`, `event_type`, `payload`, `created_at`
- [x] 1.5 Create migration `0013_post_intake_agents.sql` seeding four default agent prompts
- [x] 1.6 Add Zod output schemas in `lib/pipeline/schemas.ts` for all four agent JSON shapes

## 2. Pipeline core infrastructure

- [x] 2.1 Create `lib/pipeline/run-agent.ts` — load prompt, call OpenAI, Zod-validate, optional persist
- [x] 2.2 Create `lib/pipeline/load-prompt.ts` — read from `agent_prompts` by key, support draft override for tests
- [x] 2.3 Create `lib/pipeline/assemble-input.ts` — build typed input contexts per agent from users/rooms
- [x] 2.4 Create `lib/pipeline/log-event.ts` — write to `pipeline_event_logs`
- [x] 2.5 Create `lib/pipeline/gate.ts` — check both sides intake + personal bot ready; idempotency per agent; `isPostIntakePipelineComplete(roomId)`

## 3. Agent implementations

- [x] 3.1 Implement `lib/pipeline/agents/psychodynamic.ts` — input: `personal_bot_prompt`; persist to user
- [x] 3.2 Implement `lib/pipeline/agents/emotional-triggers.ts` — input: prompt + dispute answers; persist to user
- [x] 3.3 Implement `lib/pipeline/agents/interests.ts` — input: both sides' dispute answers (+ optional profiles); persist to room
- [x] 3.4 Implement `lib/pipeline/agents/legal-analysis.ts` — RAG retrieval via `ragSearchForRoom` + LLM synthesis with citations; persist to room
- [x] 3.5 Create `lib/pipeline/legal-tools.ts` stub interface for future external legal tools

## 4. Orchestrator and trigger

- [x] 4.1 Implement `lib/pipeline/orchestrator.ts` — per-user agents parallel, then room agents parallel; set `post_intake_pipeline_completed_at`
- [x] 4.2 Implement `lib/pipeline/trigger.ts` — `tryRunPostIntakePipeline(roomId)` with fire-and-forget semantics
- [x] 4.3 Hook trigger into `app/dispute-intake/actions.ts` `submitDisputeIntake` after successful submission

## 5. Mediation lobby gate

- [x] 5.1 Extend `getMediationLobbyData` with `pipelineComplete`, `pipelineRunning`, and `canStartMediation` flags
- [x] 5.2 Update `MediationLobby` — show agents-working banner when `pipelineRunning`; disable Start Mediation until `canStartMediation`
- [x] 5.3 Add polling in `MediationLobby` (router.refresh every ~20s) while pipeline is running
- [x] 5.4 Guard `startMediation` server action — reject if pipeline incomplete
- [x] 5.5 Add EN/UK i18n strings for agents-working message in `lib/portal-i18n.ts`

## 6. Admin Prompts tab UI

- [x] 6.1 Create `components/admin/agent-prompts-settings-content.tsx` with four horizontal sub-tabs
- [x] 6.2 Replace Prompts tab placeholder in `components/admin/settings-content.tsx`
- [x] 6.3 Load agent prompts on Settings page (`app/admin/settings/page.tsx`) and pass to component
- [x] 6.4 Create `app/admin/settings/agent-prompt-actions.ts` — `saveAgentPrompt`, `testAgentPrompt` server actions
- [x] 6.5 Implement Psychodynamic sub-tab: prompt editor, user selector (personal bot ready), test panel showing prompt + result
- [x] 6.6 Implement Interests sub-tab: prompt editor, room selector (both sides intake complete), test panel showing both sides' answers + result
- [x] 6.7 Implement Emotional Triggers sub-tab: prompt editor, user selector (prompt + intake complete), test panel showing inputs + result
- [x] 6.8 Implement Legal Analysis sub-tab: prompt editor, room selector, test panel showing dispute answers + jurisdiction + result with citations
- [x] 6.9 Add admin i18n strings in `lib/admin-i18n.ts` for sub-tab labels, test UI copy, and result field labels

## 7. Admin data queries for test selectors

- [x] 7.1 Add `lib/pipeline/admin-queries.ts` — list users eligible for Agent 1/3 tests; list rooms eligible for Agent 2/4 tests
- [x] 7.2 Add helpers to load full input preview data for selected user or room in test panels

## 8. Verification

- [x] 8.1 Manually test pipeline trigger: submit intake for both sides in a test room, verify all four outputs persisted
- [x] 8.2 Manually test mediation lobby: Start Mediation disabled while agents run, enabled after completion, auto-refresh works
- [x] 8.3 Manually test each admin agent sub-tab: save prompt, run dry-run test, confirm no live DB mutation
- [x] 8.4 Verify `pipeline_event_logs` records agent start/complete events for a full pipeline run
- [x] 8.5 Verify Agent 4 legal analysis returns citations when RAG corpus has matching documents for room jurisdiction
