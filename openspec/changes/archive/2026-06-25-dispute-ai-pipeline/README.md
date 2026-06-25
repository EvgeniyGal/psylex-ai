# Dispute AI Pipeline — Logic Overview

This document explains how the dispute workflow works end-to-end: what participants do, how the four-agent pipeline runs, how messages flow between shared and private channels, and how language preferences are applied.

**Status:** Proposed (not yet implemented). See `tasks.md` for implementation checklist.

---

## Where this fits in PsyLex

```
Onboarding (existing)          Dispute workflow (this change)
─────────────────────          ──────────────────────────────
Welcome                        Situation descriptions
Consent                        ↓
Psychological tests            4-agent AI pipeline
Personal AI bot prompt         ↓
                               3 resolution options (shared room)
                               ↓
                               Post-resolution dialogue
```

A participant must finish onboarding before entering the room. Psychological profiles are **not re-entered** — they are read automatically from completed tests and the stored `personalBot_prompt`.

---

## Participants and channels

| Channel | Who sees it | Used for |
|---------|-------------|----------|
| **Shared room** | All sides (+ mediator) | Situation descriptions, resolution options, follow-up discussion |
| **Private thread — Side N** | Side N only | Jurisdiction questions (Agent 1), clarification Q&A (Agent 4) |

Sides are **Side 1**, **Side 2** (extensible to 3–5). Each side has an independent private thread. Side 1 answering a question does not block Side 2's thread.

---

## Phase 1 — Situation descriptions

Each side submits in the shared room:

1. What happened  
2. Why they are raising the dispute  
3. Any supporting information  

**Visibility gate:** A side sees only their own submission until **every** side has submitted. Then all descriptions become visible to everyone.

**Pipeline gate:** The AI pipeline does **not** start until all sides have submitted.

```
Side 1 submits ──┐
                 ├── all submitted? ──no── wait
Side 2 submits ──┘         │
                           yes
                            ↓
                   trigger pipeline
```

---

## Phase 2 — Four-agent pipeline

### Execution order

Agent 1 must finish before anything else. Agents 2 and 3 run **in parallel**. Agent 4 runs only after both 2 and 3 complete.

```
                    ┌── Agent 2 (Precedents) ───┐
Agent 1 (Legal) ────┤                           ├──→ Agent 4 (Synthesis)
                    └── Agent 3 (Compatibility) ┘
```

### Inputs per agent

| Agent | Role | Main inputs | Stored output (DB only) |
|-------|------|-------------|-------------------------|
| **1** | Legal domain | All situation descriptions | `legal_domain`, `jurisdiction`, `applicable_norms` |
| **2** | Case law & precedents | Agent 1 output + situations | `case_law_results` |
| **3** | Compatibility | Psychological profiles + situations | `compatibility_analysis` |
| **4** | Synthesis & resolution | All prior outputs + clarification replies | 3 options → **shared room chat** |

Intermediate outputs (Agents 1–3) are saved on `room_pipeline_states` and **never shown in chat** until Agent 4 publishes the final options.

### Agent 1 — jurisdiction pause

If jurisdiction cannot be determined from the situation descriptions:

1. Agent 1 posts a question to **each side's private thread**
2. Pipeline **pauses** at Agent 1
3. When all required answers are received, Agent 1 finalizes and Agents 2 & 3 proceed

### Agent 4 — clarification loop

Before generating options, Agent 4 may need more information from each side:

1. Opens a **back-and-forth** in that side's private thread (question → answer → follow-up → …)
2. Tracks completion per side in `clarification_status` (JSONB keyed by user ID)
3. Side 1 and Side 2 clarifications run **independently**

Only when **every** side is marked complete does Agent 4:

- Generate **exactly 3** resolution options
- Publish them **simultaneously** to the shared room

---

## Room state machine

```
awaiting_situations
        │  (last side submits)
        ▼
pipeline_running          ← Agents 1, 2, 3 executing
        │
        ▼
awaiting_clarification    ← Agent 4 asking per-side questions
        │
        ▼
options_published         ← 3 options visible in shared room
        │
        ▼
post_resolution           ← follow-up, rejections, new options
```

---

## Phase 3 — Post-resolution dialogue

After options are published:

- Both sides can ask **follow-up questions** in the shared room
- Either side can **reject** the options and request alternatives
- The AI generates a **new set of options**; older sets stay in history but are superseded as the active proposal
- All messages (participants + AI) are stored in chronological order

---

## Language (EN / UK)

Each participant has `preferred_locale` (`en` or `uk`), synced from the portal LocaleSwitcher.

| Message type | Language rule |
|--------------|---------------|
| **Agent → private thread** | Recipient's `preferred_locale` |
| **Agent → shared room** | Each viewer sees their own locale; if sides differ, store `{ en, uk }` in `content_by_locale` |
| **Participant messages** | Stored as written (no auto-translation) |
| **Room UI** (labels, buttons) | Viewer's locale via `portal-i18n` |

---

## Data model (summary)

| Table / field | Purpose |
|---------------|---------|
| `situation_descriptions` | Structured per-side submission (what / why / supporting) |
| `room_messages` | All chat messages (`shared` or `private` channel) |
| `room_pipeline_states` | Phase status + agent outputs + clarification tracking |
| `agent_prompts` | Editable system prompts for all 4 agents |
| `pipeline_event_logs` | Admin-visible stage transitions and events |
| `users.preferred_locale` | `en` or `uk` for that participant |

---

## Admin — Settings → Prompts tab

The Settings page has three tabs: **Credentials**, **Tests**, **Prompts**.

On the Prompts tab admins can:

- View and edit all four agent system prompts  
- Test a prompt against sample input (dry run, no live room changes)  
- View per-room pipeline logs (stage order, pauses, errors)

---

## Orchestrator behavior

The orchestrator (`lib/pipeline/orchestrator.ts`) drives the pipeline:

1. **Runs** agents in the correct order (parallel where allowed)
2. **Pauses** when user input is needed (jurisdiction or clarification)
3. **Resumes** when a participant replies in their private thread (Server Action re-invokes orchestrator)
4. **Logs** each stage to `pipeline_event_logs`

Long-running LLM calls are split at pause points so the server does not hold a single request open across user wait time.

---

## What is explicitly out of scope (MVP)

- Real-time WebSocket chat (polling / revalidation is enough)
- Production legal RAG for Agent 2 (stub + pluggable API hook)
- Mediator access to private threads
- Push/email notifications for agent questions
- Auto-translation of participant-written messages

---

## Related artifacts

| File | Contents |
|------|----------|
| `proposal.md` | Why and what changes |
| `design.md` | Technical decisions and architecture |
| `tasks.md` | Implementation checklist |
| `specs/` | Formal requirements per capability |

To implement: run `/opsx:apply` or work through `tasks.md` in order.
