"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  clickReadyForOptions,
  downloadMediationResults,
  fetchMediationRoomState,
  sendDialogueReply,
  submitAgreementAcceptance,
  submitCompromiseVote,
  submitVote,
} from "@/app/(participant)/room/actions";
import { MediationCountdown } from "@/components/portal/mediation-countdown";
import { FlowReviewNext } from "@/components/portal/flow-review-next";
import { MediationOptionsPanel } from "@/components/portal/room/mediation-options-panel";
import { MediationCompromisePanel } from "@/components/portal/room/mediation-compromise-panel";
import { MediationResultsPanel } from "@/components/portal/room/mediation-results-panel";
import {
  MediationChat,
  MediationChatComposer,
  MediationChatStatusBar,
} from "@/components/portal/room/mediation-chat";
import { useLocale } from "@/components/locale-provider";
import { useDeadlineRefresh, useRoomRealtime } from "@/hooks/use-room-realtime";
import type { MediationPhase } from "@/lib/mediation/types";

type MediationRoomState = NonNullable<Awaited<ReturnType<typeof fetchMediationRoomState>>>;

type MediationRoomProps = {
  initialState: MediationRoomState;
  viewerRole: "party_a" | "party_b";
  onPhaseChange?: (phase: MediationPhase | null) => void;
  review?: boolean;
};

function formatReplyRemaining(deadlineIso: string | null) {
  if (!deadlineIso) return null;
  const ms = new Date(deadlineIso).getTime() - Date.now();
  if (ms <= 0) return "00:00";
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MediationRoom({ initialState, viewerRole, onPhaseChange, review = false }: MediationRoomProps) {
  const { portal: t } = useLocale();
  const [state, setState] = useState(initialState);
  const [reply, setReply] = useState("");
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const isSessionComplete = state.room.phase === "completed";

  useEffect(() => {
    if (review) return;
    onPhaseChange?.(state.room.phase);
  }, [onPhaseChange, review, state.room.phase]);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMediationRoomState();
      if (next) setState(next);
    } catch {
      // ignore transient realtime/poll errors
    }
  }, []);

  useRoomRealtime(state.room.id, () => {
    void refresh();
  }, {
    enabled: !review && !isSessionComplete,
    watchUsers: false,
  });

  const sessionEndsAt = useMemo(() => {
    if (!state.room.mediationStartedAt) return null;
    return new Date(
      new Date(state.room.mediationStartedAt).getTime() +
        state.room.mediationDurationMinutes * 60_000,
    ).toISOString();
  }, [state.room.mediationStartedAt, state.room.mediationDurationMinutes]);

  useDeadlineRefresh(state.room.turnDeadlineAt, () => {
    void refresh();
  }, !review && !isSessionComplete);

  useDeadlineRefresh(sessionEndsAt, () => {
    void refresh();
  }, !review && !isSessionComplete);

  const isMyTurn =
    state.room.phase === "dialogue" && state.room.activeParty === viewerRole;
  const isOtherPartyAnswering =
    state.room.phase === "dialogue" && !!state.room.activeParty && state.room.activeParty !== viewerRole;

  const lastMessage = state.messages.at(-1);
  const questionReady =
    state.room.phase !== "dialogue" ||
    !isMyTurn ||
    lastMessage?.messageKind === "mediation_question";

  const isAwaitingAgent = state.room.isAwaitingAgent;

  const [replyRemaining, setReplyRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!isMyTurn || !state.room.turnDeadlineAt) {
      setReplyRemaining(null);
      return;
    }

    const tick = () => setReplyRemaining(formatReplyRemaining(state.room.turnDeadlineAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isMyTurn, state.room.turnDeadlineAt]);

  const showReadyButton =
    state.room.phase === "opening" ||
    state.room.phase === "dialogue" ||
    state.room.phase === "generating_options";

  const draft = state.room.draftAgreement as {
    title?: string;
    body?: string;
    terms?: string[];
  } | null;

  const onSendReply = () => {
    if (!reply.trim()) return;
    startTransition(async () => {
      try {
        const result = await sendDialogueReply(reply.trim());
        setReply("");
        if (result.moderated) toast.message(t.mediationAttackRedirected);
        await refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onReady = () => {
    startTransition(async () => {
      try {
        const next = await clickReadyForOptions();
        if (next) setState(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onVote = (optionId: string) => {
    startTransition(async () => {
      try {
        const next = await submitVote(optionId);
        if (next) setState(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onCompromiseVote = (accepted: boolean) => {
    startTransition(async () => {
      try {
        const next = await submitCompromiseVote(accepted);
        if (next) setState(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onAccept = () => {
    startTransition(async () => {
      try {
        const next = await submitAgreementAcceptance();
        if (next) setState(next);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onDownload = () => {
    startTransition(async () => {
      try {
        const file = await downloadMediationResults();
        const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: file.mimeType });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = file.filename;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t.mediationActionFailed);
      }
    });
  };

  const onEmailPlaceholder = () => {
    toast.message(t.mediationEmailComingSoon);
  };

  const resultsSummary = "resultsSummary" in state ? state.resultsSummary : undefined;

  const votesDiffer =
    !!state.room.partyAVoteOptionId &&
    !!state.room.partyBVoteOptionId &&
    state.room.partyAVoteOptionId !== state.room.partyBVoteOptionId;

  const showOptionsPanel = state.options.length > 0 && (review || votesDiffer || state.room.phase === "voting");
  const showCompromisePanel = votesDiffer && !!state.compromise;

  const optionsPanel = showOptionsPanel ? (
    <MediationOptionsPanel
      canVote={!review && state.room.phase === "voting" && !state.room.selfVote}
      onVote={review ? undefined : onVote}
      options={state.options}
      partyAVoteOptionId={state.room.partyAVoteOptionId ?? null}
      partyBVoteOptionId={state.room.partyBVoteOptionId ?? null}
      pending={pending}
      phase={state.room.phase}
      review={review}
      selectedOptionId={state.room.selectedOptionId}
      selfVote={state.room.selfVote}
      showHeading={review || votesDiffer || state.room.phase !== "voting"}
      viewerRole={viewerRole}
    />
  ) : null;

  const compromisePanel = showCompromisePanel ? (
    <MediationCompromisePanel
      compromise={state.compromise!}
      onAccept={review ? undefined : () => onCompromiseVote(true)}
      onReject={review ? undefined : () => onCompromiseVote(false)}
      options={state.options}
      partyACompromiseVote={state.room.partyACompromiseVote ?? null}
      partyAVoteOptionId={state.room.partyAVoteOptionId ?? null}
      partyBCompromiseVote={state.room.partyBCompromiseVote ?? null}
      partyBVoteOptionId={state.room.partyBVoteOptionId ?? null}
      pending={pending}
      phase={state.room.phase}
      review={review}
      selectedOptionId={state.room.selectedOptionId}
      selfCompromiseVote={state.room.selfCompromiseVote}
    />
  ) : null;

  const reviewOptionsPanel = review ? optionsPanel : null;
  const reviewCompromisePanel = review ? compromisePanel : null;

  const chatLabels = {
    you: t.mediationYou,
    agent: t.mediationAgent,
    system: t.mediationSystem,
    preparing: t.mediationPreparing,
  };

  const chatStatusHeader = (
    <MediationChatStatusBar
      tone={isOtherPartyAnswering ? "other" : isMyTurn ? "own" : "neutral"}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wide text-on-surface shadow-sm">
        <span className="material-symbols-outlined text-[16px] text-tertiary">forum</span>
        {t.mediationPhases[state.room.phase ?? "opening"]}
      </span>
      {state.room.phase === "dialogue" ? (
        <>
          <span className="inline-flex items-center rounded-full bg-white/70 px-2.5 py-1 text-[12px] font-medium text-on-surface shadow-sm">
            {t.mediationRoundLabel} {state.room.round}
          </span>
          {isMyTurn ? (
            <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-law">
              <span className="material-symbols-outlined text-[18px]">edit_square</span>
              {t.mediationYourTurn}
            </span>
          ) : null}
          {isOtherPartyAnswering ? (
            <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-party-a">
              <span className="material-symbols-outlined animate-pulse text-[18px]">hourglass_top</span>
              {t.mediationOtherPartyAnswering}
            </span>
          ) : null}
          {isMyTurn ? (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 font-mono text-[12px] font-semibold text-law shadow-sm">
              <span className="material-symbols-outlined text-[16px]">timer</span>
              {replyRemaining ?? "--:--"}
            </span>
          ) : null}
        </>
      ) : null}
    </MediationChatStatusBar>
  );

  const chatStatusSubheader =
    isOtherPartyAnswering && !review ? (
      <p className="bg-party-a-fill/25 px-4 py-2 text-body-sm font-medium text-on-surface">
        {t.mediationOtherPartyAnsweringHint}
      </p>
    ) : null;

  const chatComposer =
    !review && isMyTurn ? (
      !questionReady ? (
        <div className="flex items-center gap-2 px-4 py-3 text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-tertiary">progress_activity</span>
          {t.mediationQuestionIncoming}
        </div>
      ) : (
        <MediationChatComposer
          disabled={pending}
          onChange={setReply}
          onSend={onSendReply}
          pending={pending}
          placeholder={t.mediationReplyPlaceholder}
          sendLabel={t.mediationSendReply}
          value={reply}
        />
      )
    ) : null;

  if (review) {
    return (
      <div className="space-y-6">
        <MediationChat
          header={chatStatusHeader}
          labels={chatLabels}
          messages={state.messages}
          subheader={chatStatusSubheader}
        />
        {reviewOptionsPanel}
        {reviewCompromisePanel}
        <FlowReviewNext step={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isSessionComplete && resultsSummary ? (
        <>
          <p className="font-display text-headline-md text-success">{t.mediationSessionCompleted}</p>
          {optionsPanel}
          {compromisePanel}
          <MediationResultsPanel summary={resultsSummary} />
          <div className="space-y-3 border-t border-hair pt-4">
            <button className="btn-secondary px-4 py-2 text-body-sm" disabled={pending} onClick={onDownload} type="button">
              {t.mediationDownloadResults}
            </button>
            <div className="flex flex-wrap gap-2">
              <input
                className="min-w-[200px] flex-1 rounded-lg border border-hair bg-paper px-3 py-2 text-body-sm"
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.mediationEmailPlaceholder}
                type="email"
                value={email}
              />
              <button className="btn-secondary px-4 py-2 text-body-sm" onClick={onEmailPlaceholder} type="button">
                {t.mediationEmailSend}
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {!isSessionComplete ? (
            <MediationCountdown
              durationMinutes={state.room.mediationDurationMinutes}
              onEnded={refresh}
              sessionComplete={isSessionComplete}
              startedAt={state.room.mediationStartedAt}
            />
          ) : null}

          {isAwaitingAgent ? (
            <div className="flex items-start gap-3 rounded-xl border border-law-line bg-law-fill/40 p-4">
              <span className="material-symbols-outlined animate-spin text-tertiary">progress_activity</span>
              <p className="text-body-sm text-on-surface-variant">{t.mediationAwaitingAgent}</p>
            </div>
          ) : null}

          {showReadyButton ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-law-line bg-law-fill/40 p-4">
              <button
                className="btn-secondary px-4 py-2 text-body-sm disabled:opacity-60"
                disabled={pending || state.room.selfReady}
                onClick={onReady}
                type="button"
              >
                {state.room.selfReady ? t.mediationReadyConfirmed : t.mediationReadyForOptions}
              </button>
              {state.room.selfReady && state.room.otherReady ? (
                <span className="text-body-sm text-on-surface-variant">{t.mediationOtherReady}</span>
              ) : state.room.selfReady ? (
                <span className="text-body-sm text-on-surface-variant">{t.mediationWaitingOtherReady}</span>
              ) : (
                <span className="text-body-sm text-on-surface-variant">{t.mediationReadyForOptionsHint}</span>
              )}
            </div>
          ) : null}

          <MediationChat
            footer={chatComposer ?? undefined}
            header={chatStatusHeader}
            labels={chatLabels}
            messages={state.messages}
            subheader={chatStatusSubheader ?? undefined}
          />

          {optionsPanel}
          {compromisePanel}

          {state.room.phase === "agreement" && draft ? (
            <div className="space-y-4">
              <h2 className="font-display text-headline-md text-on-surface">
                {draft.title ?? t.mediationAgreementTitle}
              </h2>
              <div className="glass-panel whitespace-pre-wrap rounded-xl p-4 text-body-md text-on-surface">
                {draft.body}
              </div>
              {draft.terms?.length ? (
                <ul className="list-disc space-y-1 pl-5 text-body-md text-on-surface">
                  {draft.terms.map((term, index) => (
                    <li key={`${term}-${index}`}>{term}</li>
                  ))}
                </ul>
              ) : null}
              <p className="rounded-lg border border-hair bg-surface-container p-3 text-body-sm text-on-surface-variant">
                {t.mediationUplDisclaimer}
              </p>
              <button
                className="btn-primary px-4 py-2 text-body-sm disabled:opacity-60"
                disabled={pending || state.room.selfAccepted}
                onClick={onAccept}
                type="button"
              >
                {state.room.selfAccepted ? t.mediationAccepted : t.mediationIAccept}
              </button>
              {!state.room.selfAccepted && state.room.otherAccepted ? (
                <p className="text-body-sm text-on-surface-variant">{t.mediationWaitingOtherAccept}</p>
              ) : null}
            </div>
          ) : null}

          {isSessionComplete && !resultsSummary ? (
            <p className="text-body-md text-on-surface-variant">{t.mediationNoAgreementOutcome}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
