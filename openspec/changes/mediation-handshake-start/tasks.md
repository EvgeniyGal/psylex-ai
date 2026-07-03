## 1. Database schema and migrations

- [x] 1.1 Add to `drizzle/schema.ts` on `rooms`: `side1MediationStartClickedAt`, `side2MediationStartClickedAt`, `mediationStartedAt`, `mediationDurationMinutes` (integer, default 20)
- [x] 1.2 Create migration `0015_mediation_handshake.sql` adding the four columns with snake_case names

## 2. Handshake logic module

- [x] 2.1 Create `lib/mediation/handshake.ts` with `HANDSHAKE_WINDOW_MS = 60_000` and types for handshake status (`idle`, `waiting`, `started`, `expired`, `ineligible`)
- [x] 2.2 Implement `evaluateHandshake(room)` — apply window rules, return status + `oppositeClicked` + `windowExpiresAt` + `selfClicked`
- [x] 2.3 Implement `recordStartClick(roomId, role)` in a DB transaction — record click, evaluate, set `mediation_started_at` when both clicks valid, clear expired clicks
- [x] 2.4 Implement `getHandshakeStatusForUser(userId)` — load room, enforce `canStartMediation`, return poll-friendly status object

## 3. Server actions

- [x] 3.1 Replace `startMediation()` redirect with `clickStartMediation()` returning JSON status; keep eligibility guards
- [x] 3.2 Add `getMediationHandshakeStatus()` read-only server action for lobby polling
- [x] 3.3 Revalidate `/mediation` and `/room` paths after handshake state changes

## 4. Mediation lobby UI

- [x] 4.1 Update `MediationLobby` — call `clickStartMediation` on button click; handle `waiting`, `expired`, `started` responses
- [x] 4.2 Add handshake status banners: waiting for opposite side, opposite already clicked, window expired
- [x] 4.3 Poll `getMediationHandshakeStatus` every 3s while handshake is active; `router.push('/room')` on `started`
- [x] 4.4 Show remaining seconds in the 60-second window when self has clicked and waiting
- [x] 4.5 Add EN/UK i18n strings in `lib/portal-i18n.ts` for all handshake messages

## 5. Route guards and mediation page

- [x] 5.1 Update `app/(participant)/mediation/page.tsx` — redirect to `/room` if `mediation_started_at` is already set
- [x] 5.2 Update `app/(participant)/room/page.tsx` — redirect to `/mediation` if `mediation_started_at` is not set
- [x] 5.3 Extend `getRoomPageData` (or lobby query) to pass `mediationStartedAt` and `mediationDurationMinutes` to room UI

## 6. Mediation room countdown

- [x] 6.1 Create `components/portal/mediation-countdown.tsx` — client component ticking every second, displays `MM:SS`
- [x] 6.2 Integrate countdown into `RoomExperience` above existing placeholder content
- [x] 6.3 Show localized session-ended message when countdown reaches 00:00
- [x] 6.4 Add EN/UK i18n strings for countdown label and session-ended message

## 7. Verification

- [x] 7.1 Manually test: Side 1 clicks Start Mediation — sees waiting state, opposite-not-clicked message
- [x] 7.2 Manually test: Side 2 clicks within 60s — both browsers redirect to `/room` with ~20:00 countdown
- [x] 7.3 Manually test: only one side clicks, wait 60s+ — window expires, both must click again
- [x] 7.4 Manually test: `/room` blocked before handshake, accessible after; `/mediation` redirects to room when already started
- [x] 7.5 Manually test: Start Mediation button still disabled until post-intake pipeline completes
