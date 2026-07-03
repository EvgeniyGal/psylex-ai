## Context

Participants reach the mediation lobby (`/mediation`) after completing tests, personal-bot generation, dispute intake, and the four post-intake analysis agents. The lobby already gates the **Start Mediation** button on `canStartMediation` (both sides ready + pipeline complete).

Today, `startMediation()` immediately redirects the clicking participant to `/room`; the opposite side is not involved. The room page (`RoomExperience`) is a placeholder with no session timing.

This change introduces a **mutual handshake** before entering the room and a **20-minute countdown** once mediation begins.

## Goals / Non-Goals

**Goals:**

- Both sides must click **Start Mediation** within a **60-second window** (measured from the first click) before mediation starts
- First clicker sees whether the opposite side has clicked; both are redirected when the handshake completes
- Expired solo clicks are cleared; both sides must click again after timeout
- Persist handshake and session start timestamps on `rooms`
- Show a visible **20-minute countdown** in the mediation room from `mediation_started_at`
- Block `/room` access until `mediation_started_at` is set

**Non-Goals:**

- Mediation room chat, agent dialogue, resolution flow, or post-session behavior
- WebSockets or real-time push — polling via Server Action is sufficient (same pattern as pipeline polling in `MediationLobby`)
- Mediator participation in the handshake (mediators use a separate flow)
- Configurable session duration in admin UI (hard-coded 20 minutes; column allows future override)
- Re-starting mediation after the 20-minute window ends

## Decisions

### 1. Handshake state on `rooms` table

**Decision:** Add four columns to `rooms`:

| Column | Type | Purpose |
|--------|------|---------|
| `side1_mediation_start_clicked_at` | timestamptz, nullable | Side 1 clicked Start Mediation |
| `side2_mediation_start_clicked_at` | timestamptz, nullable | Side 2 clicked Start Mediation |
| `mediation_started_at` | timestamptz, nullable | Set when handshake succeeds |
| `mediation_duration_minutes` | integer, default 20 | Session length for countdown |

**Rationale:** Room-scoped state is natural — one handshake per dispute room. Per-side columns avoid a separate join table.

**Alternative:** Store clicks on `users` — rejected because handshake is a room-level coordination primitive.

### 2. Handshake window semantics

**Decision:** `HANDSHAKE_WINDOW_MS = 60_000`. Evaluation rules:

1. If `mediation_started_at` is set → handshake complete (idempotent).
2. If neither side has clicked → `idle`.
3. If exactly one side clicked:
   - If `now - clickedAt > 60s` → `expired` (clear both click columns on next interaction).
   - Else → `waiting` (show opposite-side status to the clicker).
4. If both sides clicked:
   - If `max(t1, t2) - min(t1, t2) <= 60s` → **start mediation** (`mediation_started_at = max(t1, t2)`), clear click columns optional (keep for audit or leave — prefer keep for debugging).
   - Else → `expired` (clicks too far apart; clear both, require re-click).

**Rationale:** Matches user requirement — both must click within one minute of each other. Solo-click expiry prevents indefinite "I'm waiting" states.

### 3. Server actions API

**Decision:** Refactor `startMediation()` into two actions:

- `clickStartMediation()` — records the caller's click, runs handshake evaluation, returns `{ status: 'started' | 'waiting' | 'expired' | 'ineligible', oppositeClicked: boolean, windowExpiresAt: string | null }`. On `started`, client navigates to `/room`.
- `getMediationHandshakeStatus()` — read-only poll endpoint with same shape (no mutation). Used by lobby polling interval.

Both actions enforce existing guards: side participant, dispute intake submitted, `canStartMediation`.

**Rationale:** Separating read (poll) from write (click) avoids accidental re-clicks on poll. Return JSON instead of server redirect on click so the client can show waiting UI without full page reload.

**Alternative:** `router.refresh()` only — rejected because handshake sub-states need finer-grained client feedback between refreshes.

### 4. Lobby polling

**Decision:** When handshake status is `waiting` (self clicked, opposite not yet), poll `getMediationHandshakeStatus()` every **3 seconds**. When status becomes `started`, `router.push('/room')`. When `expired`, show message and re-enable button.

Also poll while opposite may have clicked first (user lands on lobby with opposite already waiting) — if `oppositeClicked && !selfClicked`, show banner encouraging user to click.

**Rationale:** 3s is responsive enough for a 60s window without heavy load. Matches existing 10–30s refresh pattern in lobby but faster during active handshake.

### 5. Room page guard and countdown

**Decision:**

- `room/page.tsx`: redirect to `/mediation` if `!room.mediation_started_at`.
- `RoomExperience`: receive `mediationStartedAt` and `mediationDurationMinutes` as props.
- Client component `MediationCountdown` computes `endsAt = startedAt + duration * 60_000`, ticks every second, displays `MM:SS` remaining. At zero, show localized "session time ended" message; no further behavior yet.

**Rationale:** Server-authoritative start time prevents client clock skew on duration. Countdown is client-side for smooth UI.

### 6. i18n

**Decision:** Add EN + UK strings in `portal-i18n.ts`:

- Waiting for opposite side to click
- Opposite side has clicked — click Start Mediation to join (with seconds remaining)
- Handshake window expired — click Start Mediation again
- Countdown label and session-ended message

## Risks / Trade-offs

- **[Race on simultaneous clicks]** Two requests may evaluate handshake concurrently → Mitigation: use a single DB transaction with `SELECT … FOR UPDATE` on the room row when recording clicks and setting `mediation_started_at`.
- **[Stale poll after start]** One browser may poll slightly after the other already started → Mitigation: poll action returns `started` if `mediation_started_at` is set; both redirect.
- **[Clock skew]** Countdown uses server `mediation_started_at` as source of truth; minor skew vs client clock acceptable for MVP.
- **[User leaves during wait]** Solo click expires after 60s automatically on next poll or click — no background job needed.

## Migration Plan

1. Add migration `0011_mediation_handshake.sql` with new `rooms` columns.
2. Deploy schema + server actions + lobby UI + room countdown.
3. Existing rooms without `mediation_started_at` continue to use lobby handshake — no data backfill required.
4. Rollback: revert app code; nullable columns are harmless if left in place.

## Open Questions

- Should participants who already started be able to re-enter `/room` after refresh during the 20-minute window? **Assumption: yes** — guard only checks `mediation_started_at` is set, not countdown expiry.
- Should clicking Start Mediation again after session started be a no-op? **Assumption: yes** — lobby redirects to room if `mediation_started_at` is set.
