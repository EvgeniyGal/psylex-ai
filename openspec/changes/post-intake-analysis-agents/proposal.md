## Why

Participants now complete dispute intake (three conflict questions per side) and reach the mediation lobby, but no automated analysis runs afterward. The platform needs a four-agent pipeline that turns personal-bot psychology data and dispute answers into structured profiles, interest mapping, emotional triggers, and jurisdiction-aware legal analysis — with admin-managed prompts and dry-run testing before results feed the mediation room.

## What Changes

- Introduce a **post-intake analysis pipeline** triggered when **both sides** in a room have submitted their three dispute-intake answers (`dispute_intake_submitted_at` set).
- Add **Agent 1 — Psychodynamic Profile**: reads a side's `personal_bot_prompt`, generates a psychodynamic profile, persists on `users`.
- Add **Agent 2 — Interests Analysis**: reads both sides' dispute-intake answers, identifies conflicting interests and common ground, persists on `rooms`.
- Add **Agent 3 — Emotional Triggers**: reads a side's `personal_bot_prompt` plus that side's dispute-intake answers, determines emotional triggers, persists on `users`.
- Add **Agent 4 — Legal Analysis**: reads both sides' dispute-intake answers, uses the existing legal RAG corpus (`lib/rag/`) scoped to `rooms.jurisdiction`, generates applicable laws and regulations with citations, persists on `rooms`. Designed for future additional legal tools.
- Reintroduce **`agent_prompts`** table (or equivalent) with four agent keys and default system prompts.
- Replace the admin Settings **Prompts** tab placeholder with four sub-tabs — one per agent — each supporting prompt edit/save and isolated test runs that show inputs and output without mutating live room data.
- Add orchestration in `lib/pipeline/` to run per-user agents (1 and 3) per side and room-level agents (2 and 4) when the gate is satisfied.
- **Gate Start Mediation** on the mediation lobby until all four agents finish — participants see a waiting message while analysis runs.
- Add result columns on `users` and `rooms` plus optional pipeline event logging for observability.

## Capabilities

### New Capabilities

- `post-intake-agents`: Four-agent post-intake analysis pipeline — trigger gate, orchestration, per-agent input assembly, OpenAI invocation, structured output validation, and persistence to `users` / `rooms`.

### Modified Capabilities

- `dispute-ai-pipeline`: Replace the archived four-agent model (legal domain → precedents ∥ compatibility → synthesis) with the new post-intake four-agent model (psychodynamic ∥ emotional triggers per side, then interests ∥ legal analysis at room level).
- `agent-prompts-settings`: Implement the Prompts tab (currently "coming soon") with four agent sub-tabs, editable system prompts, and agent-specific dry-run testing UIs.
- `data-persistence`: Add user columns for psychodynamic profile and emotional triggers; room columns for interests analysis and legal analysis; restore `agent_prompts` storage.
- `situation-description`: Update pipeline gate requirement to reference dispute-intake completion on `users` (three questions per side) instead of the deprecated `situation_descriptions` flow.

## Impact

- **Database**: New Drizzle migration — `agent_prompts` table; `users.psychodynamic_profile`, `users.psychodynamic_profile_at`, `users.emotional_triggers`, `users.emotional_triggers_at`; `rooms.interests_analysis`, `rooms.interests_analysis_at`, `rooms.legal_analysis`, `rooms.legal_analysis_at`; optional `pipeline_event_logs`.
- **Pipeline**: New `lib/pipeline/` modules — orchestrator, shared `runAgent` wrapper, four agent modules, input assemblers for user/room context.
- **Admin UI**: `components/admin/settings-content.tsx` Prompts tab; new `agent-prompts-settings-content.tsx` with four sub-tabs; server actions for prompt CRUD and test invocations.
- **RAG integration**: Agent 4 uses `lib/rag/agent-tool.ts` and `lib/rag/inquiry.ts` patterns for retrieval + cited synthesis.
- **Trigger point**: Hook after dispute-intake submission (`app/dispute-intake/actions.ts`) when both sides are complete; mediation lobby polls until pipeline completes.
- **Participant UI**: `mediation-lobby.tsx` — disable Start Mediation while agents run; show localized "agents working, please wait" message.
- **Specs**: Supersedes portions of archived `dispute-ai-pipeline` design that assumed `situation_descriptions` and Agents 1–4 (legal domain / precedents / compatibility / synthesis).
