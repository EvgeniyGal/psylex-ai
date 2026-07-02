## Context

PsyLex participants complete onboarding (four psychological tests → Airtable-synced `personal_bot_prompt`), submit three dispute-intake questions per side (`dispute_description`, `dispute_priority`, `dispute_acceptable_outcome` on `users`), and reach the mediation lobby when both sides are ready. The room UI is still a placeholder.

An archived four-agent pipeline (legal domain → precedents ∥ compatibility → synthesis) was designed and later removed in migration `0010_remove_dispute_pipeline.sql`. The admin Settings **Prompts** tab is a "coming soon" stub. Legal RAG is fully implemented (`lib/rag/`, admin RAG tab with test inquiry).

This change implements a **new** four-agent post-intake analysis pipeline aligned with current data model (dispute intake on `users`, not `situation_descriptions`).

## Goals / Non-Goals

**Goals:**

- Trigger analysis automatically when both sides in a room have `dispute_intake_submitted_at` set
- Run four LLM agents with admin-editable system prompts and dry-run testing in Settings → Prompts
- Persist per-user outputs (psychodynamic profile, emotional triggers) and per-room outputs (interests analysis, legal analysis)
- Integrate Agent 4 (Legal Analysis) with existing hybrid RAG (`ragSearchForRoom`, citation rules from `lib/rag/inquiry.ts`)
- Log pipeline events for admin observability
- Idempotent re-runs: skip agents whose outputs already exist unless explicitly re-triggered
- Block **Start Mediation** until all four agent types complete; show a waiting message on the mediation lobby while the pipeline runs

**Non-Goals:**

- Shared-room chat, private threads, clarification Q&A, or resolution-option publication (future work)
- Real-time WebSocket updates (Server Action + revalidation is sufficient)
- Replacing Airtable personal-bot generation — agents **consume** `personal_bot_prompt`, they do not regenerate it
- External legal APIs beyond RAG (architecture leaves hooks for future tools)
- Participant visibility of agent outputs in the room UI (stored silently for now, same as archived intermediate-output policy)
- Background job queue (Inngest/BullMQ) — in-process async via Server Action is sufficient for MVP

## Decisions

### 1. Pipeline trigger and gate

**Decision:** Trigger in `tryRunPostIntakePipeline(roomId)` called from `submitDisputeIntake` after each submission. Gate condition: both room sides have non-null `dispute_intake_submitted_at` AND both have non-empty `personal_bot_prompt` with `personal_bot_ready_at` set.

**Rationale:** Matches user requirement ("when both sides answered three questions"). Personal-bot readiness is a hard prerequisite for Agents 1 and 3.

**Alternative:** Trigger on mediation start — rejected because analysis must complete before participants enter the room.

### 2. Mediation lobby gate (Start Mediation button)

**Decision:** Split readiness into two layers:

| Layer | Condition | UI |
|-------|-----------|-----|
| `bothReady` | Both sides: tests + personal bot + dispute intake complete | Existing status badges |
| `pipelineComplete` | All agent outputs persisted for the room | Enables Start Mediation |
| `canStartMediation` | `bothReady && pipelineComplete` | Button enabled |

`pipelineComplete` is true when all of the following exist:
- Side 1: `psychodynamic_profile_at`, `emotional_triggers_at`
- Side 2: `psychodynamic_profile_at`, `emotional_triggers_at`
- Room: `interests_analysis_at`, `legal_analysis_at`

Also set `rooms.post_intake_pipeline_completed_at` when the orchestrator finishes all agents.

**Mediation lobby UI states:**

1. **Waiting for opposite side** (`!bothReady`) — existing info message; button disabled
2. **Agents working** (`bothReady && !pipelineComplete`) — show localized banner: agents are analyzing the dispute; may take several minutes; please wait; button disabled; optional spinner
3. **Ready to start** (`canStartMediation`) — button enabled

**Polling:** While in state 2, `MediationLobby` polls via `router.refresh()` every 15–30 seconds (same pattern as testing dashboard) so the button enables without manual reload.

**Server-side guard:** `startMediation()` rejects redirect to `/room` if `!pipelineComplete` even if the client is stale.

### 3. Execution topology

```text
Both sides intake complete
    ├── Agent 1 (Psychodynamic) for Side 1  ─┐
    ├── Agent 1 (Psychodynamic) for Side 2  ─┤ parallel per-user
    ├── Agent 3 (Emotional Triggers) S1   ─┤
    └── Agent 3 (Emotional Triggers) S2   ─┘
              ↓ (all four complete)
    ├── Agent 2 (Interests Analysis)      ─┐ parallel room-level
    └── Agent 4 (Legal Analysis + RAG)   ─┘
```

Per-user agents (1, 3) can run in parallel across sides. Room agents (2, 4) start only after all per-user agents for both sides complete (Agent 3 needs dispute answers; Agent 2 benefits from psychodynamic profiles but primarily uses dispute intake — profiles included as optional enrichment).

**Rationale:** User described four distinct agents without strict sequential dependency between 1 and 3; room agents need both sides' data.

### 4. Agent keys and storage

| Agent | `agent_key` | Storage | Columns |
|-------|-------------|---------|---------|
| Psychodynamic Profile | `psychodynamic` | `users` | `psychodynamic_profile` (jsonb), `psychodynamic_profile_at` |
| Interests Analysis | `interests` | `rooms` | `interests_analysis` (jsonb), `interests_analysis_at` |
| Emotional Triggers | `emotional_triggers` | `users` | `emotional_triggers` (jsonb), `emotional_triggers_at` |
| Legal Analysis | `legal_analysis` | `rooms` | `legal_analysis` (jsonb), `legal_analysis_at` |

**JSON shapes** (Zod-validated):

```typescript
// psychodynamic_profile
{ summary: string; traits: string[]; attachmentStyle?: string; defenseMechanisms?: string[]; relationalPatterns?: string[] }

// emotional_triggers
{ triggers: { label: string; description: string; intensity: "low"|"medium"|"high" }[]; summary: string }

// interests_analysis
{ conflictingInterests: { side: "side1"|"side2"; interest: string; rationale: string }[]; commonGround: string[]; summary: string }

// legal_analysis
{ applicableLaws: { name: string; summary: string; relevance: string }[]; regulations: { name: string; summary: string }[]; analysis: string; citations: { documentName: string; excerpt: string; sourceUrl?: string }[] }
```

**Rationale:** JSONB enables structured admin test display and future UI consumption. Text-only rejected as harder to render consistently.

### 5. `agent_prompts` table

Reintroduce table dropped in migration 0010:

```sql
agent_prompts (id uuid PK, agent_key text UNIQUE, system_prompt text, updated_at timestamptz)
```

Seed four default prompts on migration. `loadAgentPrompt(agentKey)` reads from DB; admin saves via Settings UI.

### 6. Shared `runAgent` wrapper

`lib/pipeline/run-agent.ts`:

1. Load system prompt from `agent_prompts` (or accept draft override for admin tests)
2. Assemble user message from typed input context
3. Call OpenAI Chat Completions (`gpt-4o-mini`, temperature 0) via `platform_settings.openai_api_key`
4. Parse JSON from response; Zod-validate
5. On production run: persist to target table; log to `pipeline_event_logs`
6. On admin test: return result only, no persistence

Mirror patterns from `lib/rag/inquiry.ts` for OpenAI client setup.

### 7. Agent-specific input assembly

| Agent | Input assembler |
|-------|-----------------|
| `psychodynamic` | `users.personal_bot_prompt` only |
| `emotional_triggers` | `personal_bot_prompt` + three `dispute_*` fields for that user |
| `interests` | Both sides' `dispute_*` fields + optional `psychodynamic_profile` if available |
| `legal_analysis` | Both sides' `dispute_*` fields + `rooms.jurisdiction` + RAG excerpts |

`lib/pipeline/assemble-input.ts` centralizes this; `lib/room/helpers.ts` `getRoomSides()` for cross-side data.

### 8. Legal Analysis RAG integration

**Decision:** Agent 4 generates search queries from combined dispute text, calls `ragSearchForRoom(roomId, queries)` (no category filter initially; category may be inferred from dispute content in a future enhancement). Pass top excerpts into LLM with strict citation rules (adapt `SYSTEM_PROMPT` from `lib/rag/inquiry.ts`).

**Rationale:** User specified existing RAG system; room jurisdiction already scopes corpus. Legal-domain classification is folded into Agent 4 rather than a separate Agent 1.

**Future:** Additional tools (external APIs) plug in via `lib/pipeline/legal-tools.ts` interface without changing orchestrator.

### 9. Admin Prompts tab UI

Replace placeholder in `settings-content.tsx` with `AgentPromptsSettingsContent`:

- Horizontal sub-tabs: Psychodynamic | Interests | Emotional Triggers | Legal Analysis
- Each sub-tab: system prompt textarea, Save button, Test panel

**Test panels per agent:**

| Agent | Test selector | Inputs shown | Action |
|-------|---------------|--------------|--------|
| Psychodynamic | User/side dropdown (users with `personal_bot_prompt`) | Personal bot prompt | Generate profile |
| Interests | Room dropdown (rooms where both sides submitted intake) | Both sides' dispute answers | Generate analysis |
| Emotional Triggers | User/side dropdown (prompt + intake complete) | Prompt + dispute answers | Generate triggers |
| Legal Analysis | Room dropdown (both sides intake complete) | Dispute answers + jurisdiction | Generate legal analysis |

Server actions in `app/admin/settings/agent-prompt-actions.ts`. Pattern follows `app/admin/settings/rag-actions.ts` `testInquiry()`.

### 10. Pipeline event logging

Reintroduce lightweight `pipeline_event_logs`:

```sql
(id, room_id, user_id nullable, agent_key, event_type, payload jsonb, created_at)
```

Events: `agent_started`, `agent_completed`, `agent_failed`, `pipeline_triggered`, `pipeline_completed`.

Enables future pipeline log viewer in admin (spec requirement retained from `agent-prompts-settings`).

### 11. Orchestrator location

`lib/pipeline/orchestrator.ts` — `runPostIntakePipeline(roomId: string)`:

- Check gate; return early if not ready or already `pipeline_completed`
- Run per-user agents with `Promise.all`
- Run room agents with `Promise.all`
- Catch per-agent errors; log and continue where safe (room agents fail independently)
- Set `rooms.post_intake_pipeline_completed_at` when all six agent runs finish (required for mediation gate)

Invoked from `submitDisputeIntake` via fire-and-forget `void runPostIntakePipeline(roomId)` (don't block participant redirect).

## Risks / Trade-offs

- **[Risk] Long LLM latency blocks Server Action** → Fire-and-forget orchestrator; participant redirect is not blocked; failures logged.
- **[Risk] Duplicate pipeline runs on concurrent submissions** → Idempotency check on output timestamps; optional advisory lock on `room_id` during orchestration.
- **[Risk] JSON parse failures from LLM** → Zod validation + single retry with "respond with valid JSON only" suffix; log failure.
- **[Risk] RAG corpus empty for jurisdiction** → Agent 4 proceeds with empty excerpts; output notes insufficient corpus (same as archived Agent 2 behavior).
- **[Risk] Large `personal_bot_prompt` exceeds token limits** → Truncate with warning in logs; admin can tune prompts.
- **[Trade-off] No job queue** → Simpler MVP but no automatic retries on Vercel timeout; acceptable until scale demands it.

## Migration Plan

1. Apply Drizzle migration: `agent_prompts`, user/room output columns, `pipeline_event_logs`, seed prompts
2. Deploy `lib/pipeline/` modules (no UI change yet — pipeline runs but outputs hidden)
3. Deploy admin Prompts tab UI
4. Existing rooms with both sides already submitted: optional one-time backfill script or manual admin re-trigger (not in MVP scope)

**Rollback:** New columns are additive; disable orchestrator hook to stop new runs; admin prompts table harmless if unused.

## Open Questions

- Should Agent 2 (Interests) require psychodynamic profiles from Agent 1, or run in parallel with per-user agents? **Current decision:** wait for per-user agents so interests analysis can reference profiles.
- Should participants ever see agent outputs in mediation room UI in this change? **Current decision:** no — storage only.
- Pipeline log viewer UI: include in this change or defer? **Current decision:** log table + spec requirement; minimal admin viewer can be a follow-up task if time-constrained.
