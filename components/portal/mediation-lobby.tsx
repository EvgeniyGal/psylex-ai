"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  clickStartMediation,
  getMediationHandshakeStatus,
  runPostIntakePipelineForRoom,
} from "@/app/dispute-intake/actions";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { useLocale } from "@/components/locale-provider";
import type { HandshakeStatusResponse } from "@/lib/mediation/handshake";
import type { SideReadiness } from "@/lib/dispute-intake";
import type { PartyRole } from "@/lib/participant-roles";

type MediationLobbyProps = {
  roomId: string;
  roomTitle: string;
  self: SideReadiness;
  opposite: SideReadiness | null;
  oppositeRole: PartyRole;
  bothReady: boolean;
  pipelineRunning: boolean;
  canStartMediation: boolean;
  viewerRole: PartyRole;
};

function StatusBadge({ ready, readyLabel, notReadyLabel }: { ready: boolean; readyLabel: string; notReadyLabel: string }) {
  return (
    <div
      className={
        ready
          ? "flex items-center gap-2 rounded border border-success bg-success/10 px-3 py-2 text-success"
          : "flex items-center gap-2 rounded border border-error bg-error/10 px-3 py-2 text-error"
      }
    >
      <span className="material-symbols-outlined text-sm">{ready ? "check_circle" : "pending"}</span>
      <span className="font-display text-label-md uppercase">{ready ? readyLabel : notReadyLabel}</span>
    </div>
  );
}

function useWindowSecondsRemaining(windowExpiresAt: string | null) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!windowExpiresAt) {
      setSeconds(null);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(windowExpiresAt).getTime() - Date.now()) / 1000));
      setSeconds(remaining);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [windowExpiresAt]);

  return seconds;
}

export function MediationLobby({
  roomId,
  roomTitle,
  self,
  opposite,
  oppositeRole,
  bothReady,
  pipelineRunning,
  canStartMediation,
  viewerRole,
}: MediationLobbyProps) {
  const { portal: t } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [handshake, setHandshake] = useState<HandshakeStatusResponse | null>(null);
  const windowSeconds = useWindowSecondsRemaining(
    handshake?.status === "waiting" && handshake.selfClicked ? handshake.windowExpiresAt : null,
  );

  const applyHandshake = useCallback(
    (result: HandshakeStatusResponse) => {
      setHandshake(result);
      if (result.status === "started") {
        router.refresh();
        router.push("/room");
      }
    },
    [router],
  );

  useEffect(() => {
    if (!pipelineRunning || !roomId) return;

    const kickPipeline = () => {
      void runPostIntakePipelineForRoom(roomId)
        .then((result) => {
          if (result.status === "complete" || result.status === "ran") {
            router.refresh();
          }
        })
        .catch((error) => {
          console.error("Failed to run post-intake pipeline:", error);
        });
    };

    kickPipeline();

    const retryId = window.setInterval(kickPipeline, 30000);
    const refreshId = window.setInterval(() => {
      router.refresh();
    }, 10000);

    return () => {
      window.clearInterval(retryId);
      window.clearInterval(refreshId);
    };
  }, [pipelineRunning, roomId, router]);

  useEffect(() => {
    if (!canStartMediation) return;
    void getMediationHandshakeStatus().then(applyHandshake);
  }, [canStartMediation, applyHandshake]);

  const handshakeActive =
    handshake?.status === "waiting" ||
    handshake?.status === "started" ||
    (handshake?.oppositeClicked && !handshake?.selfClicked);

  useEffect(() => {
    if (!canStartMediation || !handshakeActive) return;

    const pollId = window.setInterval(() => {
      void getMediationHandshakeStatus().then((result) => {
        if (result.status === "started") {
          applyHandshake(result);
          return;
        }
        setHandshake((prev) => (prev?.status === "started" ? prev : result));
      });
    }, 3000);

    return () => window.clearInterval(pollId);
  }, [canStartMediation, handshakeActive, applyHandshake]);

  const handleStart = () => {
    startTransition(async () => {
      const result = await clickStartMediation();
      applyHandshake(result);
    });
  };

  const oppositeReady = !!opposite?.mediationReady;
  const waitingForOpposite = handshake?.status === "waiting" && handshake.selfClicked;
  const oppositeReadyToStart = !!handshake?.oppositeClicked && !handshake?.selfClicked;
  const handshakeExpired = handshake?.status === "expired";
  const startDisabled =
    !canStartMediation || isPending || waitingForOpposite || handshake?.status === "started";

  return (
    <PortalPageShell>
      <main className="mx-auto flex w-full max-w-2xl flex-grow flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-display-lg text-on-surface">{t.mediationLobbyTitle}</h1>
          <p className="font-sans text-body-lg text-on-surface-variant">{roomTitle}</p>
          <p className="mt-2 font-sans text-body-sm text-on-surface-variant">{t.mediationLobbySubtitle}</p>
        </div>

        <div className="flex flex-col gap-stack-sm">
          <div className="rounded border border-hair border-t-[3px] border-t-party-a bg-surface-container p-6">
            <h2 className="mb-4 font-display text-headline-md text-ink">{t.mediationYourStatus}</h2>
            <p className="mb-3 font-sans text-body-sm text-on-surface-variant">{t.roles[viewerRole]}</p>
            <StatusBadge
              notReadyLabel={t.mediationStatusNotReady}
              ready={self.mediationReady}
              readyLabel={t.mediationStatusReady}
            />
          </div>

          <div className="rounded border border-hair border-t-[3px] border-t-party-b bg-surface-container p-6">
            <h2 className="mb-4 font-display text-headline-md text-ink">{t.mediationOppositeSide}</h2>
            <p className="mb-3 font-sans text-body-sm text-on-surface-variant">{t.roles[oppositeRole]}</p>
            {opposite ? (
              <StatusBadge
                notReadyLabel={t.mediationStatusNotReady}
                ready={oppositeReady}
                readyLabel={t.mediationStatusReady}
              />
            ) : (
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationOppositeNotReady}</p>
            )}
          </div>
        </div>

        <div className="mt-stack-md flex flex-col items-center gap-stack-sm">
          {!bothReady ? (
            <div className="flex w-full items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container p-4">
              <span className="material-symbols-outlined mt-1 text-tertiary">info</span>
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationOppositeNotReady}</p>
            </div>
          ) : null}

          {pipelineRunning ? (
            <div className="flex w-full items-start gap-3 rounded border border-law-line bg-law-fill p-4">
              <span className="material-symbols-outlined mt-1 animate-spin text-tertiary">progress_activity</span>
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationAgentsWorking}</p>
            </div>
          ) : null}

          {waitingForOpposite ? (
            <div className="flex w-full items-start gap-3 rounded border border-law-line bg-law-fill p-4">
              <span className="material-symbols-outlined mt-1 animate-pulse text-tertiary">hourglass_top</span>
              <div className="font-sans text-body-sm text-on-surface-variant">
                <p>{t.mediationHandshakeWaiting}</p>
                {windowSeconds !== null ? (
                  <p className="mt-1 font-display text-label-md text-tertiary">
                    {t.mediationHandshakeWindowRemaining.replace("{seconds}", String(windowSeconds))}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {oppositeReadyToStart ? (
            <div className="flex w-full items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4">
              <span className="material-symbols-outlined mt-1 text-success">person_check</span>
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationHandshakeOppositeReady}</p>
            </div>
          ) : null}

          {handshakeExpired ? (
            <div className="flex w-full items-start gap-3 rounded-lg border border-error/30 bg-error/10 p-4">
              <span className="material-symbols-outlined mt-1 text-error">timer_off</span>
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationHandshakeExpired}</p>
            </div>
          ) : null}

          <button
            className="btn-primary flex w-full items-center justify-center gap-2 px-8 py-4 font-display text-label-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            disabled={startDisabled}
            onClick={handleStart}
            type="button"
          >
            {isPending ? (
              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-xl">gavel</span>
            )}
            {t.mediationStart}
          </button>
        </div>
      </main>
    </PortalPageShell>
  );
}
