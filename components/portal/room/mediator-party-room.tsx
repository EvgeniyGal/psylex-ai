"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  fetchMediatorPartyRoomState,
  sendMediatorPartyReply,
  submitMediatorPartyAgreement,
} from "@/app/mediator/rooms/party-actions";
import { submitCompromiseVote, submitVote } from "@/app/(participant)/room/actions";
import { SessionElapsedTimer } from "@/components/mediator/session-elapsed-timer";
import { PartyActionBanner } from "@/components/portal/party-action-banner";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { MediationOptionsPanel } from "@/components/portal/room/mediation-options-panel";
import { MediationCompromisePanel } from "@/components/portal/room/mediation-compromise-panel";
import { MediationChat, MediationChatComposer } from "@/components/portal/room/mediation-chat";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { usePartyActionNotifications } from "@/hooks/use-party-action-notifications";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { resolveRoomFlowStep } from "@/lib/participant-flow";
import type { MediatorSessionRoomState } from "@/lib/mediator-session/orchestrator";
import type { PartyNotification } from "@/lib/mediator-session/types";
import type { PartyRole } from "@/lib/participant-roles";
import type { MediationPhase } from "@/lib/mediation/types";

type MediatorPartyRoomProps = {
  initialState: MediatorSessionRoomState;
  viewerRole: PartyRole;
  review?: boolean;
};

export function MediatorPartyRoom({
  initialState,
  viewerRole,
  review = false,
}: MediatorPartyRoomProps) {
  const { portal: t } = useLocale();
  const [state, setState] = useState(initialState);
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();

  const notification = state.room.partyNotification as PartyNotification | null;
  const { banner, clearBanner } = usePartyActionNotifications({
    notification,
    viewerRole,
    enabled: !review,
  });

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMediatorPartyRoomState();
      if (next) setState(next);
    } catch {
      /* ignore */
    }
  }, []);

  useRoomRealtime(state.room.id, () => {
    if (!review) void refresh();
  }, {
    enabled: !review,
    watchUsers: false,
  });

  const phase = state.room.phase as MediationPhase | null;
  const flowStep = resolveRoomFlowStep(phase, review);

  const actionBanner =
    banner ||
    (state.room.pendingQuestion
      ? t.modeBNotifyQuestion
      : phase === "voting"
        ? t.modeBNotifyOptions
        : phase === "voting_discrepancy" && state.compromise
          ? t.modeBNotifyCompromise
          : phase === "voting_discrepancy" && !state.compromise
            ? t.modeBWaitingCompromisePublish
            : phase === "agreement"
              ? t.modeBNotifyAgreement
              : null);

  const onSend = () => {
    if (!reply.trim()) return;
    startTransition(async () => {
      try {
        const result = await sendMediatorPartyReply(reply);
        if (result.moderated) toast.message(t.mediationAttackRedirected);
        setReply("");
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onVote = (optionId: string) => {
    startTransition(async () => {
      try {
        await submitVote(optionId);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onCompromise = (accepted: boolean) => {
    startTransition(async () => {
      try {
        await submitCompromiseVote(accepted);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onAcceptAgreement = () => {
    startTransition(async () => {
      try {
        const next = await submitMediatorPartyAgreement();
        if (next) setState(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  return (
    <PortalPageShell flowStep={flowStep}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-margin-mobile py-stack-md md:px-margin-desktop">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-headline-md text-on-surface">{state.room.title}</h1>
          <SessionElapsedTimer startedAt={state.room.mediationStartedAt} />
        </div>

        <PartyActionBanner
          message={actionBanner}
          onDismiss={banner ? clearBanner : undefined}
        />

        {phase === "voting" || phase === "agreement" || phase === "completed" ? (
          <MediationOptionsPanel
            canVote={phase === "voting" && !state.room.selfVote && !review}
            onVote={onVote}
            options={state.options}
            partyAVoteOptionId={viewerRole === "party_a" ? state.room.selfVote : state.room.otherVote}
            partyBVoteOptionId={viewerRole === "party_b" ? state.room.selfVote : state.room.otherVote}
            pending={pending}
            phase={phase}
            selectedOptionId={state.room.selectedOptionId}
            selfVote={state.room.selfVote}
            viewerRole={viewerRole}
          />
        ) : null}

        {phase === "voting_discrepancy" ? (
          state.compromise ? (
            <MediationCompromisePanel
              compromise={{
                id: state.compromise.id,
                description: state.compromise.description,
                legalNorms: state.compromise.legalNorms,
                fulfillmentProbability: state.compromise.fulfillmentProbability,
                refusalRisks: state.compromise.refusalRisks,
              }}
              onAccept={() => onCompromise(true)}
              onReject={() => onCompromise(false)}
              options={state.options}
              partyACompromiseVote={
                viewerRole === "party_a" ? state.room.selfCompromiseVote : state.room.otherCompromiseVote
              }
              partyBCompromiseVote={
                viewerRole === "party_b" ? state.room.selfCompromiseVote : state.room.otherCompromiseVote
              }
              partyAVoteOptionId={viewerRole === "party_a" ? state.room.selfVote : state.room.otherVote}
              partyBVoteOptionId={viewerRole === "party_b" ? state.room.selfVote : state.room.otherVote}
              pending={pending}
              phase={phase}
              review={review}
              selectedOptionId={state.room.selectedOptionId}
              selfCompromiseVote={state.room.selfCompromiseVote}
            />
          ) : (
            <div className="glass-panel rounded-xl p-4 text-body-sm text-on-surface-variant">
              <Spinner className="mb-2" size="sm" />
              {t.modeBWaitingCompromisePublish}
            </div>
          )
        ) : null}

        {phase === "agreement" && state.draftAgreement ? (
          <div className="glass-panel space-y-3 rounded-xl p-4">
            <h3 className="font-display text-headline-sm">{state.draftAgreement.title}</h3>
            <p className="whitespace-pre-wrap text-body-sm">{state.draftAgreement.body}</p>
            {!state.room.agreementAccepted && !review ? (
              <button
                className="btn-primary px-4 py-2 text-body-sm"
                disabled={pending}
                onClick={onAcceptAgreement}
                type="button"
              >
                {t.mediationIAccept}
              </button>
            ) : (
              <p className="text-body-sm text-success">{t.mediationAccepted}</p>
            )}
          </div>
        ) : null}

        <MediationChat
          header={
            <div className="px-4 py-3">
              <p className="font-display text-label-md uppercase text-on-surface-variant">
                {t.mediationPhaseLabel}:{" "}
                {phase ? (t.mediationPhases[phase] ?? phase) : "—"}
              </p>
            </div>
          }
          labels={{
            preparing: t.mediationPreparing,
            you: t.mediationYou,
            agent: t.mediationAgent,
            system: t.mediationSystem,
          }}
          messages={state.messages.map((m) => ({
            id: m.id,
            senderType: m.senderType,
            content: m.content,
            createdAt: m.createdAt,
            isOwn: m.isOwn,
          }))}
          footer={
            state.room.canReply && !review ? (
              <MediationChatComposer
                disabled={pending}
                onChange={setReply}
                onSend={onSend}
                pending={pending}
                placeholder={t.mediationReplyPlaceholder}
                sendLabel={t.mediationSendReply}
                value={reply}
              />
            ) : undefined
          }
        />
      </div>
    </PortalPageShell>
  );
}
