# Post-Resolution Dialogue

## REMOVED Requirements

### Requirement: Follow-up questions in shared room

**Reason**: Post-resolution follow-up is superseded by the structured mediation session flow (`mediation-session-flow`) where dialogue, options, voting, and agreement occur in a single orchestrated session before completion.

**Migration**: Participants ask follow-up questions during mediation dialogue rounds; after `mediation_phase` is `completed`, the room shows session results and download only—no separate post-resolution chat loop.

### Requirement: Option rejection and alternatives

**Reason**: Option iteration via rejection in shared chat is replaced by the mediation voting flow (match → agreement, discrepancy → one-time compromise round).

**Migration**: Use the voting and compromise flows in `mediation-session-flow`; admins tune option quality via Mediation Agent prompt testing.

### Requirement: Dialogue available only after options published

**Reason**: Dialogue now precedes option publication as part of `mediation-session-flow`; the `options_published` pipeline state is no longer the gate for participant dialogue.

**Migration**: Gate dialogue on `mediation_phase` `dialogue` after handshake; remove dependency on `room_pipeline_states.status` `options_published` for chat enablement.

### Requirement: All dialogue messages persisted

**Reason**: Requirement is retained in spirit under `room-messaging` and `mediation-session-flow` but removed here to avoid duplicate/conflicting specs.

**Migration**: All mediation messages persist via `room_messages` with mediation `message_kind` values per `room-messaging` delta spec.
