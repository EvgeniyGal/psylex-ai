## Context

Mode A rooms use AI-driven turn-based mediation. Mode B rooms (`createdByUserId` set) require a human mediator in the loop.

## Goals

- Parallel Mode B orchestrator; Mode A code paths early-return when `isMediatorFacilitatedRoom`
- Scheduling + 10-minute start window + three-party handshake
- Mediator question candidates (3 per party), editable send
- Mediator-triggered options; compromise held for mediator edit before parties vote
- In-app party notifications (toast + banner); no email/push in v1

## Non-Goals

- Changing Mode A timers, dialogue rounds, or ready-for-options
- Offline/email notifications

## Decisions

- Branch on `createdByUserId` (existing Mode A/B footer distinction)
- Store pending candidates and compromise draft on `rooms` JSONB columns
- Session clock uses elapsed time from `mediator_session_started_at` (no 60-minute force end)
