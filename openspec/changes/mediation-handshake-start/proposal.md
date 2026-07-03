## Why

After both sides complete onboarding, dispute intake, and post-intake agent analysis, the mediation lobby currently lets either participant click **Start Mediation** and immediately enter the room alone. Mediation requires mutual presence — both sides must consciously agree to begin at the same time. A synchronized handshake with a visible countdown ensures neither party enters an empty session and sets clear expectations for the 20-minute mediation window.

## What Changes

- Replace immediate redirect on **Start Mediation** with a **mutual handshake**: both sides must click the button within a **60-second window** before mediation begins.
- Persist per-side "ready to start" timestamps on the room; expire stale clicks when the window closes so both sides must click again.
- Poll from the lobby while waiting so the first clicker sees whether the opposite side has clicked and is redirected automatically when the handshake completes.
- Show localized status messages: waiting for opposite side, opposite side clicked (window open), window expired (click again).
- On successful handshake, set `mediation_started_at` on the room and redirect both browsers to `/room`.
- Add a **20-minute countdown timer** in the mediation room UI, visible to both sides, counting down from session start.
- Guard `/room` so participants cannot enter until the handshake is complete and mediation has started.
- Room functional logic (chat, agents, resolution) remains out of scope — placeholder content may remain beneath the timer.

## Capabilities

### New Capabilities

- `mediation-handshake`: Synchronized two-party start from the mediation lobby — click recording, 60-second pairing window, polling/status UI, mediation start gate, and 20-minute session countdown in the room.

### Modified Capabilities

- `data-persistence`: Add room columns for per-side mediation-start click timestamps, `mediation_started_at`, and optional `mediation_duration_minutes` default (20).

## Impact

- **Database**: Drizzle migration — `rooms.side1_mediation_start_clicked_at`, `rooms.side2_mediation_start_clicked_at`, `rooms.mediation_started_at`; optional `mediation_duration_minutes` default 20.
- **Server actions**: Replace `startMediation()` immediate redirect with click-recording + handshake evaluation; new read action or route for lobby polling state.
- **Participant UI**: `mediation-lobby.tsx` — handshake states, polling interval, opposite-side status; `room-experience.tsx` — countdown timer component.
- **Routing guards**: `app/(participant)/room/page.tsx` and `startMediation()` — require `mediation_started_at` set and within active session (or always allow re-entry during session).
- **i18n**: New `portal-i18n` strings for handshake and countdown copy (EN + UK).
- **Dependencies**: Builds on existing post-intake lobby gate (`canStartMediation`) — button only enabled when agents complete.
