## Why

Participants can now handshake into a mediation room with a 20-minute countdown, but no AI-driven mediation runs: there is no opening presentation adapted to each party's psychodynamic profile, no structured dialogue, no solution options, voting, or agreement signing. The platform needs a full mediation session flow—led by a dedicated Mediation Agent—that turns post-intake analysis into a guided negotiation and produces a voluntary agreement document, with the same admin prompt management and room-based dry-run testing pattern used for the four post-intake agents.

## What Changes

- Add a **Mediation Agent** that runs when mediation starts: prepares the same underlying situation for each party but presents it adapted to that party's `psychodynamic_profile` (from Agent 1). Both parties share one chat channel; each sees only their own adapted rendering of agent messages.
- Implement **mediation session phases**: opening → dialogue rounds (up to 3) → solution options → voting → agreement signing → session complete.
- **Dialogue rounds**: AI asks structured questions to each party in turn; 2-minute per-reply timer; blocks personal attacks and redirects to substance; summarizes after each round; **"I am ready for solution options"** button always visible—when **both** parties click, dialogue ends early.
- **Transition to solution options** when any of: 3 rounds completed, both parties clicked ready, 20-minute session timer expired, or AI determines data sufficiency.
- **Recommendation engine**: generate 2–3 solution options, each with brief description, applicable legal norms (information, not advice), fulfillment-probability assessment (using psychoprofiles), risks of refusal, and per-party presentation adaptation (identical substance).
- **Voting**: each party selects an option independently without seeing the other's choice until the finale. Match → proceed to signing. Discrepancy → one-time second round revealing choices and a compromise option.
- **Draft agreement**: generate document from the selected option; both parties confirm via **"I accept"**; optional email delivery of PDF; download results; mandatory UPL disclaimer; session completed with filing receipt saved.
- Extend **admin Settings → Prompts** with a Mediation Agent sub-tab with **full parity** to the four post-intake agents: editable system prompt (save/load), room-based dry-run testing (including unsaved draft prompts), and pipeline log visibility for live mediation runs.
- Persist mediation phase state, round progress, ready flags, options, votes, agreement status, and events for observability.

## Capabilities

### New Capabilities

- `mediation-agent`: Mediation Agent invocation—opening situation adaptation per psychoprofile, dialogue moderation (attack blocking, redirection, round summaries), data-sufficiency assessment, solution-option generation with per-party presentation, and compromise-option generation after voting discrepancy.
- `mediation-session-flow`: Participant-facing mediation session orchestration—phases, timers (20-minute session, 2-minute reply), dialogue rounds, ready-for-solutions handshake, transition rules, voting UI with hidden choices, discrepancy second round, and session completion.
- `mediation-agreement`: Draft agreement document generation from the selected option, dual-party acceptance, PDF download, optional email delivery, UPL disclaimer display, and filing receipt persistence.

### Modified Capabilities

- `mediation-handshake`: Replace the countdown-only placeholder at session end with integration into the mediation session flow; clarify that the 20-minute timer governs dialogue/options phases and triggers transition when expired.
- `agent-prompts-settings`: Add Mediation Agent with **same admin UX as existing agents**—prompt edit/save, room-selector dry-run testing (draft prompt supported), and extended pipeline logs for `mediation` invocations.
- `room-messaging`: Support per-party adapted agent content in the shared channel—same underlying message, different rendered text per viewer based on psychoprofile adaptation metadata.
- `data-persistence`: Add mediation session state columns/tables (phase, round, timers, ready flags, options JSON, votes, agreement record, filing receipt).
- `post-resolution-dialogue`: Supersede the prior "options published by Agent 4" follow-up model with the new mediation-agent-driven options, voting, and agreement flow.
- `admin-dashboard`: Surface mediation session logs and test-run history alongside existing pipeline monitoring where applicable.

## Impact

- **Database**: New Drizzle migration—`agent_prompts` key `mediation`; room mediation phase/status fields; tables or JSON columns for options, votes, agreement, filing receipt; possible `mediation_events` log.
- **Pipeline / agents**: New `lib/pipeline/agents/mediation.ts` (or `lib/mediation/`) with sub-handlers for opening, dialogue, options, compromise; input assembly from room post-intake outputs (`interests_analysis`, `legal_analysis`, psychoprofiles, dispute intake, emotional triggers).
- **Participant UI**: `/room` becomes the active mediation experience—phase-specific views, timers, ready button, option cards, voting, acceptance, download/email.
- **Admin UI**: Extend `agent-prompts-settings-content.tsx` with Mediation Agent sub-tab and room-based simulation test panel.
- **Document generation**: PDF generation service (new module) consuming agreement content; optional email send action.
- **Localization**: New copy for all mediation phases, timers, buttons, UPL disclaimer, and error states in `en` / `uk`.
- **Specs**: Builds on `post-intake-agents` outputs and `mediation-handshake` entry gate; replaces placeholder behavior in `mediation-handshake` and much of `post-resolution-dialogue`.
