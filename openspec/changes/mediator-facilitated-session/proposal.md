## Why

Mediator-created rooms (Mode B) need a facilitator-led session workflow distinct from admin Mode A self-resolution: scheduling, three-party handshake, mediator-controlled questions/options, and party action notifications — without changing Mode A behavior.

## What Changes

- Schedule mediator sessions after parties complete tests, conflict questions, and post-intake AI analysis
- Three-party start handshake with a 10-minute lead window and countdown to scheduled time
- Live mediator session console: generate/select/edit/send questions; generate options anytime; edit/publish compromise
- Party Mode B room with elapsed timer and in-app action notifications
- Strict isolation: Mode A (`createdByUserId = null`) keeps existing lobby, handshake, timers, and orchestrator

## Impact

- Specs: mediator-facilitated-session (new), mediation-handshake/session-flow deltas for Mode B branching
- Code: `lib/mediator-session/*`, mediator routes, party lobby/room branching, schema columns on `rooms`
