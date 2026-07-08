"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { MediationResultsPanel } from "@/components/portal/room/mediation-results-panel";
import { useLocale } from "@/components/locale-provider";
import type { MediationPhase } from "@/lib/mediation/types";

type MediationRoomState = NonNullable<Awaited<ReturnType<typeof fetchMediationRoomState>>>;

type MediationRoomProps = {
  initialState: MediationRoomState;
  viewerRole: "party_a" | "party_b";
  onPhaseChange?: (phase: MediationPhase | null) => void;
  review?: boolean;
};

const POLL_MS = 3000;

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
  const router = useRouter();
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
      // ignore transient poll errors
    }
  }, []);

  useEffect(() => {
    if (review || isSessionComplete) return;

    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh, isSessionComplete, review]);

  const isMyTurn =
    state.room.phase === "dialogue" && state.room.activeParty === viewerRole;

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

  const reviewOptionsPanel =
    review && state.options.length > 0 ? (
      <MediationOptionsPanel
        canVote={false}
        options={state.options}
        partyAVoteOptionId={state.room.partyAVoteOptionId ?? null}
        partyBVoteOptionId={state.room.partyBVoteOptionId ?? null}
        pending={pending}
        phase={state.room.phase}
        review
        selectedOptionId={state.room.selectedOptionId}
        selfVote={state.room.selfVote}
        viewerRole={viewerRole}
      />
    ) : null;

  const liveVotingPanel =
    !review && state.room.phase === "voting" && state.options.length > 0 ? (
      <MediationOptionsPanel
        canVote={!state.room.selfVote}
        onVote={onVote}
        options={state.options}
        partyAVoteOptionId={state.room.partyAVoteOptionId ?? null}
        partyBVoteOptionId={state.room.partyBVoteOptionId ?? null}
        pending={pending}
        phase={state.room.phase}
        selectedOptionId={state.room.selectedOptionId}
        selfVote={state.room.selfVote}
        showHeading={false}
        viewerRole={viewerRole}
      />
    ) : null;

  if (review) {
    return (
      <div className="space-y-6">
        <div className="glass-panel max-h-[540px] space-y-3 overflow-y-auto rounded-xl p-4">
          {state.messages.map((message) => (
            <div
              className={
                message.isOwn
                  ? "ml-8 rounded-lg bg-party-a-fill/40 p-3 text-body-md"
                  : message.senderType === "agent"
                    ? "mr-8 rounded-lg border border-law/20 bg-law-fill/30 p-3 text-body-md"
                    : "rounded-lg bg-surface-container p-3 text-body-md"
              }
              key={message.id}
            >
              <p className="mb-1 text-label-sm uppercase text-on-surface-variant">
                {message.isOwn
                  ? t.mediationYou
                  : message.senderType === "agent"
                    ? t.mediationAgent
                    : t.mediationSystem}
              </p>
              <p className="whitespace-pre-wrap text-on-surface">{message.content}</p>
            </div>
          ))}
          {state.messages.length === 0 ? (
            <p className="text-center text-body-md text-on-surface-variant">{t.mediationPreparing}</p>
          ) : null}
        </div>
        {reviewOptionsPanel}
        <FlowReviewNext step={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isSessionComplete && resultsSummary ? (
        <>
          <p className="font-display text-headline-md text-success">{t.mediationSessionCompleted}</p>
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

          <div className="glass-panel rounded-xl p-4 text-body-sm text-on-surface-variant">
            <p>
              {t.mediationPhaseLabel}:{" "}
              <strong className="text-on-surface">{t.mediationPhases[state.room.phase ?? "opening"]}</strong>
            </p>
            {state.room.phase === "dialogue" ? (
              <p>
                {t.mediationRoundLabel}: {state.room.round}
                {isMyTurn ? ` · ${t.mediationYourTurn}` : ""}
                {replyRemaining
                  ? ` · ${t.mediationReplyTimer}: ${replyRemaining}`
                  : isMyTurn
                    ? ` · ${t.mediationReplyTimer}: --:--`
                    : ""}
              </p>
            ) : null}
          </div>

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

          <div className="glass-panel max-h-[420px] space-y-3 overflow-y-auto rounded-xl p-4">
            {state.messages.map((message) => (
              <div
                className={
                  message.isOwn
                    ? "ml-8 rounded-lg bg-party-a-fill/40 p-3 text-body-md"
                    : message.senderType === "agent"
                      ? "mr-8 rounded-lg border border-law/20 bg-law-fill/30 p-3 text-body-md"
                      : "rounded-lg bg-surface-container p-3 text-body-md"
                }
                key={message.id}
              >
                <p className="mb-1 text-label-sm uppercase text-on-surface-variant">
                  {message.isOwn
                    ? t.mediationYou
                    : message.senderType === "agent"
                      ? t.mediationAgent
                      : t.mediationSystem}
                </p>
                <p className="whitespace-pre-wrap text-on-surface">{message.content}</p>
              </div>
            ))}
            {state.messages.length === 0 ? (
              <p className="text-center text-body-md text-on-surface-variant">{t.mediationPreparing}</p>
            ) : null}
          </div>

          {liveVotingPanel}

          {isMyTurn ? (
            <div className="space-y-2">
              {!questionReady ? (
                <div className="flex items-center gap-2 rounded-lg border border-law-line bg-law-fill/40 p-3 text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-tertiary">progress_activity</span>
                  {t.mediationQuestionIncoming}
                </div>
              ) : (
                <>
                  <textarea
                    className="w-full rounded-lg border border-hair bg-paper p-3 text-body-md text-ink"
                    onChange={(event) => setReply(event.target.value)}
                    placeholder={t.mediationReplyPlaceholder}
                    rows={3}
                    value={reply}
                  />
                  <button
                    className="btn-primary px-4 py-2 text-body-sm disabled:opacity-60"
                    disabled={pending || !reply.trim()}
                    onClick={onSendReply}
                    type="button"
                  >
                    {t.mediationSendReply}
                  </button>
                </>
              )}
            </div>
          ) : null}

          {state.room.phase === "voting_discrepancy" && state.compromise ? (
            <div className="space-y-4">
              <p className="text-body-md text-on-surface">
                {t.mediationOtherChose}: {state.room.otherVote}
              </p>
              <div className="glass-panel space-y-2 rounded-xl p-4">
                <h2 className="font-display text-headline-md text-on-surface">{t.mediationCompromiseTitle}</h2>
                <p className="whitespace-pre-wrap text-body-md">{state.compromise.description}</p>
                {state.room.selfCompromiseVote === null ? (
                  <div className="flex gap-2">
                    <button
                      className="btn-primary px-4 py-2 text-body-sm"
                      disabled={pending}
                      onClick={() => onCompromiseVote(true)}
                      type="button"
                    >
                      {t.mediationAcceptCompromise}
                    </button>
                    <button
                      className="btn-secondary px-4 py-2 text-body-sm"
                      disabled={pending}
                      onClick={() => onCompromiseVote(false)}
                      type="button"
                    >
                      {t.mediationRejectCompromise}
                    </button>
                  </div>
                ) : (
                  <p className="text-body-sm text-on-surface-variant">{t.mediationCompromiseVoteRecorded}</p>
                )}
              </div>
            </div>
          ) : null}

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

      <button
        className="text-body-sm text-on-surface-variant underline"
        onClick={() => router.refresh()}
        type="button"
      >
        {t.mediationRefresh}
      </button>
    </div>
  );
}
