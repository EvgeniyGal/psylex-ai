## 1. Database Schema & Migrations

- [x] 1.1 Add Drizzle schema for `room_messages`, `room_pipeline_states`, `situation_descriptions`, `agent_prompts`, and `pipeline_event_logs`
- [x] 1.2 Define enums for message channel, sender type, pipeline status, and `preferred_locale` (`en`, `uk`)
- [x] 1.3 Generate migration `0006_dispute_pipeline` and seed default `agent_prompts` for all four agents
- [x] 1.4 Create `room_pipeline_states` row on room creation (update `app/admin/rooms/actions.ts`)
- [x] 1.5 Backfill `room_pipeline_states` for existing rooms with `awaiting_situations`

## 2. Pipeline Core

- [x] 2.1 Create `lib/pipeline/types.ts` with Zod schemas for agent inputs/outputs and pipeline context
- [x] 2.2 Implement `lib/pipeline/psychological-profile.ts` to assemble profile from test completions and `personalBotPrompt`
- [x] 2.3 Implement `lib/pipeline/openai-client.ts` using `platform_settings.openai_api_key` with `targetLocale` prompt injection
- [x] 2.4 Implement `lib/pipeline/agents/legal-domain.ts` (Agent 1) with jurisdiction-missing pause logic
- [x] 2.5 Implement `lib/pipeline/agents/precedents.ts` (Agent 2) with `precedent-search` stub interface
- [x] 2.6 Implement `lib/pipeline/agents/compatibility.ts` (Agent 3)
- [x] 2.7 Implement `lib/pipeline/agents/synthesis.ts` (Agent 4) with per-side clarification loop and options generation
- [x] 2.8 Implement `lib/pipeline/orchestrator.ts` with Agent 1 → (2 ∥ 3) → 4 ordering and pause/resume on user input
- [x] 2.9 Implement `lib/pipeline/event-log.ts` helper to write `pipeline_event_logs` entries
- [x] 2.10 Implement `lib/pipeline/regenerate-options.ts` for post-resolution option iteration
- [x] 2.11 Implement `lib/pipeline/resolve-message-locale.ts` for per-viewer shared-room content from `content_by_locale`

## 3. Situation Description Phase

- [x] 3.1 Create `submitSituation` Server Action with onboarding-completion guard
- [x] 3.2 Implement visibility gate: hide other sides' descriptions until all sides submit
- [x] 3.3 Trigger pipeline orchestrator when final side submits
- [x] 3.4 Post situation submission as structured `situation_descriptions` row and optional shared-room system message

## 4. Room Messaging UI (Participant)

- [x] 4.1 Create `app/(participant)/room/page.tsx` with Shared Room and Private Thread tabs
- [x] 4.2 Build situation description form component (what happened, why dispute, supporting info)
- [x] 4.3 Build shared room message list with chronological ordering and phase-appropriate content
- [x] 4.4 Build private thread message list for agent questions and participant replies
- [x] 4.5 Implement `sendSharedMessage` and `sendPrivateReply` Server Actions with resume-orchestrator on reply
- [x] 4.6 Add client polling or revalidation during `pipeline_running` and `awaiting_clarification` states
- [x] 4.7 Update `DashboardComplete` to link participants to `/room` after onboarding

## 5. Resolution Options & Post-Resolution Dialogue

- [x] 5.1 Render three resolution options from Agent 4 shared-room message with structured `message_metadata`
- [x] 5.2 Implement follow-up question flow in shared room after `options_published`
- [x] 5.3 Implement option rejection action that triggers `regenerate-options` and publishes new set
- [x] 5.4 Preserve full message history with versioned option sets

## 6. Admin — Agent Prompts & Pipeline Logs

- [x] 6.1 Add Prompts tab to Settings page alongside Credentials and Tests (four prompt editors)
- [x] 6.2 Implement `saveAgentPrompt` Server Action
- [x] 6.3 Implement `testAgentPrompt` dry-run action with sample input UI
- [x] 6.4 Add pipeline log viewer on room detail page (`app/admin/rooms/[roomId]/pipeline-log`)
- [x] 6.5 Display pipeline status badge on admin room list/detail

## 7. Authorization & Guards

- [x] 7.1 Ensure participants can only access their own room and private thread
- [x] 7.2 Ensure shared room messages are visible to all room participants (sides + mediator)
- [x] 7.3 Block room access and situation submission until onboarding is complete
- [x] 7.4 Restrict prompt editing and pipeline logs to admin role

## 8. Message Localization

- [x] 8.1 Add `preferred_locale` column to `users` and sync from LocaleSwitcher via Server Action
- [x] 8.2 Extend `portal-i18n.ts` with room chat UI copy (EN/UK)
- [x] 8.3 Pass `targetLocale` through orchestrator to all participant-facing agent calls
- [x] 8.4 Store private-thread agent messages in recipient locale; shared-room agent messages in `content_by_locale` when room locales differ
- [x] 8.5 Resolve displayed message text by viewer `preferred_locale` in room UI

## 9. Verification

- [ ] 9.1 Manual test: both sides complete onboarding → submit situations → pipeline runs end-to-end
- [ ] 9.2 Manual test: Agent 1 jurisdiction question flow via private threads
- [ ] 9.3 Manual test: Agent 4 independent clarification per side → three options published
- [ ] 9.4 Manual test: post-resolution rejection generates new options
- [ ] 9.5 Manual test: admin edits prompt, runs test harness, views pipeline log
- [ ] 9.6 Manual test: Side 1 (`uk`) and Side 2 (`en`) each see resolution options and AI replies in their language
