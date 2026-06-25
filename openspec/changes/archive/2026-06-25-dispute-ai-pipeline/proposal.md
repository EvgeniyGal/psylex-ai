## Why

After onboarding tests and personal AI bot prompt generation, participants need a structured dispute workflow: each side describes their situation, an orchestrated multi-agent pipeline analyzes legal and psychological dimensions, and the system delivers resolution options through a shared room with per-side private clarification threads. This is the core product loop promised on the landing page and cannot be demonstrated without it.

## What Changes

- Add a **situation-description phase** where all room participants (Side 1, Side 2 — extensible to 3–5) submit what happened, why they are raising the dispute, and supporting information in a shared room; submissions become visible to all sides only after each side has submitted
- Gate the AI pipeline until every participant has submitted their situation description
- Pull each side's **psychological profile** automatically from onboarding test results and personal bot prompt — never re-entered manually
- Implement a **four-agent pipeline** with strict ordering: Agent 1 (Legal Domain) → Agents 2 & 3 in parallel (Precedents, Compatibility) → Agent 4 (Synthesis & Resolution)
- Store all intermediate agent outputs as room/session fields in the database; expose only Agent 4's final resolution options in the shared room chat
- Support **private threads** per side for jurisdiction questions (Agent 1) and clarification Q&A (Agent 4), independent of each other
- Enable **post-resolution dialogue** in the shared room: follow-up questions, rejection of options, and AI-generated alternatives
- Add a **Prompts** tab on the Admin Settings page (alongside Credentials and Tests) to view/edit all four agent system prompts, test prompt changes, and monitor session/room logs for pipeline correctness
- Add participant-facing **room chat UI** with shared room and private thread views after onboarding is complete
- Localize **all agent messages and room UI** in English or Ukrainian per each side's stored language preference

## Capabilities

### New Capabilities

- `situation-description`: Multi-side situation submission phase in the shared room with all-sides-complete gate before pipeline trigger
- `dispute-ai-pipeline`: Four-agent orchestrated analysis pipeline (legal domain, precedents, compatibility, synthesis) with stored intermediate outputs and per-side clarification tracking
- `room-messaging`: Shared room chat and per-side private threads with ordered message persistence and role-appropriate visibility
- `post-resolution-dialogue`: Shared-room follow-up after resolution options are published, including option rejection and AI iteration
- `agent-prompts-settings`: Admin management of four agent system prompts with test harness and pipeline log monitoring
- `message-localization`: Per-participant `en`/`uk` preference driving agent output language and shared-room per-viewer display

### Modified Capabilities

- `admin-dashboard`: Add Prompts tab to Settings (alongside Credentials and Tests), plus session/room pipeline log viewer on room detail
- `data-persistence`: Extend schema for messages, room pipeline state, agent outputs, psychological profiles, agent prompt configuration, and `preferred_locale`

## Impact

- **Database**: New tables/columns for `messages`, `room_pipeline_state`, agent output fields, `psychological_profiles`, and `agent_prompts`; Drizzle migrations required
- **Participant app**: Room experience with shared/private chat; agent and UI text in `en` or `uk` per side preference
- **Background jobs / server actions**: Pipeline orchestration (sequential + parallel agent stages), OpenAI (or configured LLM) calls, optional RAG/legal API integration for Agent 2
- **Admin app**: Settings page gains a Prompts tab (with Credentials and Tests) and pipeline log monitoring on room detail
- **Dependencies**: LLM client (OpenAI via existing `platform_settings`), potential vector store or legal API for precedent research
- **Existing onboarding**: `personalBotPrompt`, `userTestCompletions`, and test-derived profile data become pipeline inputs — no changes to test flow itself
