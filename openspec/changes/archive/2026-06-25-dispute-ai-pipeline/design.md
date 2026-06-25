## Context

PsyLex already has participant onboarding (welcome → consent → tests → personal bot prompt), room/participant management in admin, and a `rooms` / `users` schema with `side1` / `side2` roles. After onboarding, participants currently land on a static `DashboardComplete` placeholder. This change implements the core dispute workflow: situation descriptions, a four-agent AI pipeline, shared room + private threads, resolution options, and post-resolution dialogue.

Existing infrastructure:
- Drizzle ORM + Neon PostgreSQL
- `platform_settings` with `openai_api_key`
- `personalBotPrompt` and `userTestCompletions` per user
- Next.js App Router with Server Actions

## Goals / Non-Goals

**Goals:**

- Gate pipeline until all sides submit situation descriptions
- Orchestrate Agents 1 → (2 ∥ 3) → 4 with persisted intermediate outputs
- Support private threads per side for jurisdiction and clarification Q&A
- Publish exactly three resolution options to shared room when all clarifications complete
- Enable post-resolution follow-up and option iteration in shared room
- Admin Settings Prompts tab: edit, test, and monitor pipeline logs
- Extensible to 3–5 sides via participant roles and per-side clarification flags
- Agent and shared-room messages in `en` or `uk` per each side's `preferred_locale`

**Non-Goals:**

- Real-time WebSocket chat (polling or Server Action revalidation is sufficient for MVP)
- Production-grade legal RAG infrastructure (Agent 2 uses pluggable stub + optional API hook)
- Mediator participation in private threads (mediator sees shared room only)
- Email/push notifications for agent questions
- Automatic psychological profile ML — profile is assembled from existing test data + bot prompt text
- Auto-translation of participant-authored messages (stored as written; only agent output is locale-controlled)

## Decisions

### 1. Room phase state machine

```text
awaiting_situations → pipeline_running → awaiting_clarification → options_published → post_resolution
```

Stored on `room_pipeline_states.status`. Transitions:
- Room created → `awaiting_situations`
- Last situation submitted → `pipeline_running` (triggers orchestrator)
- Agent 4 begins clarification → `awaiting_clarification`
- Three options published → `options_published`
- First post-resolution participant message or rejection → `post_resolution`

**Rationale:** Single enum keeps admin logs and UI simple. **Alternative:** Per-agent status columns only — rejected as harder to reason about cross-cutting gates.

### 2. Pipeline orchestrator (in-process async)

**Decision:** `lib/pipeline/orchestrator.ts` runs agent stages sequentially/parallel within a Server Action or dedicated `POST /api/pipeline/run` handler, using `Promise.all` for Agents 2 & 3.

**Rationale:** No separate worker service for MVP; Neon + Vercel can handle moderate LLM latency. Long-running steps log to `pipeline_event_logs` for observability.

**Alternatives:**
- BullMQ / Inngest queue — better for production retries; deferred until scale requires it
- Cron polling — unnecessary complexity for event-driven trigger

**Pause/resume:** When Agent 1 or Agent 4 needs user input, orchestrator sets `current_agent`, writes private-thread messages, and exits. A new orchestrator invocation resumes on participant reply (Server Action on message send checks pending agent and re-enters orchestrator).

### 3. Agent implementation pattern

Each agent is a module under `lib/pipeline/agents/`:

| Agent | Key | Input | Output field(s) |
|-------|-----|-------|-----------------|
| 1 | `legal_domain` | All situation descriptions | `legal_domain`, `jurisdiction`, `applicable_norms` |
| 2 | `precedents` | Agent 1 output + situations | `case_law_results` (JSON) |
| 3 | `compatibility` | Profiles + situations | `compatibility_analysis` (JSON) |
| 4 | `synthesis` | All prior outputs + clarification replies | Shared-room message with 3 options |

Shared `runAgent(agentKey, context)` wrapper:
- Loads system prompt from `agent_prompts`
- Calls OpenAI Chat Completions via `platform_settings.openai_api_key`
- Logs start/complete to `pipeline_event_logs`
- Returns structured JSON (Zod-validated)

Agent 2 precedent research: `lib/pipeline/precedent-search.ts` interface with `searchPrecedents(query)` — MVP returns stub results; admin can wire legal API later.

### 4. Psychological profile assembly

**Decision:** `lib/pipeline/psychological-profile.ts` builds a profile object per user:

```text
{
  testKeys: string[] completed,
  personalBotPrompt: string,
  role: side1 | side2
}
```

No separate `psychological_profiles` table for MVP — assembled at pipeline runtime from `users` + `user_test_completions`.

**Rationale:** Avoids duplicate data; onboarding already captures source of truth.

### 5. Messaging model

**Tables:** `room_messages` (see data-persistence spec), `situation_descriptions` (structured submission separate from free-form chat).

**UI routes:**
- `app/(participant)/room/page.tsx` — tabbed: Shared Room | My Private Thread
- Shared room: situation form (until submitted), then descriptions (gated), then options + dialogue
- Private thread: agent questions and participant replies only

**Server Actions:** `app/(participant)/room/actions.ts` — `submitSituation`, `sendSharedMessage`, `sendPrivateReply`.

Revalidation: `revalidatePath('/room')` after each message; optional 5s polling on client during `pipeline_running` / `awaiting_clarification`.

### 6. Situation description visibility gate

Query pattern for shared room messages/descriptions:

```sql
-- Show all descriptions only when count(submissions) = count(sides in room)
```

Until gate passes, each side sees only their own `situation_descriptions` row plus a waiting indicator.

### 7. Agent 4 clarification loop

Agent 4 maintains per-side state in `room_pipeline_states`:
- `clarification_complete_s1`, `clarification_complete_s2` (add `s3`…`s5` columns or JSONB `clarification_complete` map for extensibility)

**Decision:** Use JSONB `clarification_status: { [userId]: { complete: boolean, round: number } }` for 3–5 side extensibility without migration churn.

Flow per side:
1. Agent 4 evaluates missing info for side N
2. If questions needed → post to private thread, set `current_agent = synthesis`, exit
3. On reply → re-run Agent 4 for that side only
4. When all sides complete → generate 3 options → insert shared `room_messages` row with `sender_type = agent`, `sender_agent = synthesis`

### 8. Admin prompts settings

Extend `components/admin/settings-content.tsx` with a third horizontal tab **Prompts** (alongside existing Credentials and Tests tabs):
- Prompts tab: four textarea editors (one per agent)
- `saveAgentPrompt(agentKey, prompt)` Server Action
- `testAgentPrompt(agentKey, sampleInput)` — calls agent module in dry-run mode, returns output to admin UI without DB writes to live rooms
- Pipeline logs: `app/admin/rooms/[roomId]/pipeline-log/page.tsx` reading `pipeline_event_logs`

Seed default prompts in migration `0006_dispute_pipeline.sql`.

### 9. Post-resolution iteration

When a participant rejects options, shared-room message triggers `lib/pipeline/regenerate-options.ts`:
- Loads full context (situations, agent outputs, dialogue history)
- Calls Agent 4 synthesis with `mode: regenerate` appended to prompt
- Publishes new options message; marks previous options as superseded via `message_metadata.options_version`

### 10. Participant dashboard redirect

**Decision:** After onboarding, `DashboardComplete` links to `/room`. If onboarding incomplete, existing redirects remain.

### 11. Message localization (`en` / `uk`)

**Decision:** Persist `users.preferred_locale` (`en` | `uk`), synced when participant uses existing `LocaleSwitcher` (Server Action updates DB + localStorage).

**Private threads:** Agent output uses recipient's `preferred_locale` only; store in `room_messages.content`.

**Shared room (agent messages):** When all sides share the same locale, store single `content` string. When mixed, store `content_by_locale: { en, uk }` and resolve at read time via `lib/pipeline/resolve-message-locale.ts`:

```text
getMessageContent(message, viewerLocale) → message.content_by_locale?.[viewerLocale] ?? message.content
```

**Agent calls:** `runAgent(..., { targetLocale })` appends system instruction: "Respond in Ukrainian" / "Respond in English". For mixed-locale shared publications, one call generates both locales (structured JSON output).

**Room UI:** Extend `portal-i18n.ts` with room-specific copy; reuse `useLocale()` for labels and status banners.

**Participant messages:** Stored as authored; no auto-translation.

**Rationale:** Reuses existing portal locale UX; server-side preference enables pipeline localization without client-only state.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Long LLM calls timeout on Vercel | Split orchestrator at pause points; resume on user action; log progress |
| Agent 2 legal RAG not ready | Stub search + interface for future API; document in admin |
| Race on simultaneous last submissions | DB unique constraint on `situation_descriptions`; trigger pipeline once via transactional check |
| Private thread messages missed by user | MVP: user must return to room UI; notifications deferred |
| JSONB clarification state harder to query | Acceptable for MVP; index `room_id` on pipeline states |
| Plain-text passwords unchanged | Existing MVP constraint; no change |
| Mixed-locale rooms double LLM output size | Generate both locales in one structured call; store JSONB |

## Migration Plan

1. Add Drizzle migration `0006_dispute_pipeline` with new tables and seed `agent_prompts`
2. Deploy migration to Neon (dev then prod)
3. Deploy application code with feature behind room existence (no flag needed — new rooms get pipeline state row on creation)
4. Backfill: create `room_pipeline_states` for existing rooms with `awaiting_situations`
5. Rollback: drop new tables if needed; participant room route returns friendly "unavailable" if tables missing

## Open Questions

- **Legal API provider for Agent 2:** Stub for MVP; evaluate CourtListener, vLex, or custom RAG corpus later.
- **Option format:** Structured JSON (title, summary, terms[]) vs markdown in message — recommend structured JSON stored in `message_metadata` with rendered markdown in UI.
- **Mediator visibility during pipeline:** Mediators see shared room only; confirm no private thread access in v1.
