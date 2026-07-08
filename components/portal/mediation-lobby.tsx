"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  clickStartMediation,
  getMediationHandshakeStatus,
  getMediationLobbyStatus,
  prepareMediationOpeningForRoom,
  runPostIntakePipelineForRoom,
} from "@/app/dispute-intake/actions";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { useLocale } from "@/components/locale-provider";
import type { HandshakeStatusResponse } from "@/lib/mediation/handshake";
import type { MediationLobbyStatus } from "@/lib/dispute-intake";
import type { PartyRole } from "@/lib/participant-roles";
import type { ParticipantFlowStepId } from "@/lib/participant-flow";

type MediationLobbyProps = {
  roomId: string;
  roomTitle: string;
  self: MediationLobbyStatus["self"];
  opposite: MediationLobbyStatus["opposite"];
  oppositeRole: PartyRole;
  bothReady: boolean;
  pipelineRunning: boolean;
  preparingMediationRoom: boolean;
  canStartMediation: boolean;
  viewerRole: PartyRole;
  flowStep: ParticipantFlowStepId;
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
  self: initialSelf,
  opposite: initialOpposite,
  oppositeRole,
  bothReady: initialBothReady,
  pipelineRunning: initialPipelineRunning,
  preparingMediationRoom: initialPreparingMediationRoom,
  canStartMediation: initialCanStartMediation,
  viewerRole,
  flowStep,
}: MediationLobbyProps) {
  const { portal: t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [lobby, setLobby] = useState({
    self: initialSelf,
    opposite: initialOpposite,
    bothReady: initialBothReady,
    pipelineRunning: initialPipelineRunning,
    preparingMediationRoom: initialPreparingMediationRoom,
    canStartMediation: initialCanStartMediation,
  });
  const [handshake, setHandshake] = useState<HandshakeStatusResponse | null>(null);
  const redirectingRef = useRef(false);
  const windowSeconds = useWindowSecondsRemaining(
    handshake?.status === "waiting" && handshake.selfClicked ? handshake.windowExpiresAt : null,
  );

  const redirectToRoom = useCallback(() => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    window.location.assign("/room");
  }, []);

  const applyLobbyStatus = useCallback((result: MediationLobbyStatus) => {
    if (result.mediationStarted) {
      redirectToRoom();
      return;
    }
    setLobby({
      self: result.self,
      opposite: result.opposite,
      bothReady: result.bothReady,
      pipelineRunning: result.pipelineRunning,
      preparingMediationRoom: result.preparingMediationRoom,
      canStartMediation: result.canStartMediation,
    });
  }, [redirectToRoom]);

  const applyHandshake = useCallback((result: HandshakeStatusResponse) => {
    setHandshake(result);
    if (result.status === "started") {
      redirectToRoom();
    }
  }, [redirectToRoom]);

  useEffect(() => {
    if (redirectingRef.current) return;

    const pollLobby = () => {
      if (redirectingRef.current) return;
      void getMediationLobbyStatus()
        .then((result) => {
          if (!result) return;
          applyLobbyStatus(result);
        })
        .catch((error) => {
          console.error("Failed to poll mediation lobby status:", error);
        });
    };

    pollLobby();
    const pollMs =
      lobby.pipelineRunning || lobby.preparingMediationRoom
        ? 5000
        : 3000;
    const pollId = window.setInterval(pollLobby, pollMs);
    return () => window.clearInterval(pollId);
  }, [applyLobbyStatus, lobby.pipelineRunning, lobby.preparingMediationRoom, lobby.canStartMediation]);

  useEffect(() => {
    if (!lobby.preparingMediationRoom || !roomId) return;

    const kickPreparation = () => {
      void prepareMediationOpeningForRoom(roomId)
        .then((result) => {
          if (result.status === "complete" || result.status === "ran") {
            void getMediationLobbyStatus()
              .then((status) => {
                if (status) applyLobbyStatus(status);
              })
              .catch((error) => {
                console.error("Failed to refresh mediation lobby status:", error);
              });
          }
        })
        .catch((error) => {
          console.error("Failed to prepare mediation opening:", error);
        });
    };

    kickPreparation();
    const retryId = window.setInterval(kickPreparation, 30000);
    return () => window.clearInterval(retryId);
  }, [applyLobbyStatus, lobby.preparingMediationRoom, roomId]);

  useEffect(() => {
    if (!lobby.pipelineRunning || !roomId) return;

    const kickPipeline = () => {
      void runPostIntakePipelineForRoom(roomId)
        .then((result) => {
          if (result.status === "complete" || result.status === "ran") {
            void getMediationLobbyStatus()
              .then((status) => {
                if (status) applyLobbyStatus(status);
              })
              .catch((error) => {
                console.error("Failed to refresh mediation lobby status:", error);
              });
          }
        })
        .catch((error) => {
          console.error("Failed to run post-intake pipeline:", error);
        });
    };

    kickPipeline();
    const retryId = window.setInterval(kickPipeline, 30000);
    return () => window.clearInterval(retryId);
  }, [applyLobbyStatus, lobby.pipelineRunning, roomId]);

  useEffect(() => {
    if (!lobby.canStartMediation || redirectingRef.current) return;

    const pollHandshake = () => {
      if (redirectingRef.current) return;
      void getMediationHandshakeStatus()
        .then((result) => {
          if (result.status === "started") {
            applyHandshake(result);
            return;
          }
          setHandshake(result);
        })
        .catch((error) => {
          console.error("Failed to poll mediation handshake status:", error);
        });
    };

    const bothClicked =
      handshake?.status === "waiting" && handshake.selfClicked && handshake.oppositeClicked;
    const pollMs = bothClicked ? 1000 : 3000;

    pollHandshake();
    const pollId = window.setInterval(pollHandshake, pollMs);
    return () => window.clearInterval(pollId);
  }, [
    lobby.canStartMediation,
    applyHandshake,
    handshake?.status,
    handshake?.selfClicked,
    handshake?.oppositeClicked,
  ]);

  const handleStart = () => {
    startTransition(async () => {
      const result = await clickStartMediation();
      applyHandshake(result);
    });
  };

  const oppositeReady = !!lobby.opposite?.mediationReady;
  const waitingForOpposite =
    handshake?.status === "waiting" && handshake.selfClicked && !handshake.oppositeClicked;
  const handshakeStarting =
    handshake?.status === "waiting" && handshake.selfClicked && handshake.oppositeClicked;
  const oppositeReadyToStart = !!handshake?.oppositeClicked && !handshake?.selfClicked;
  const handshakeExpired = handshake?.status === "expired";
  const startDisabled =
    !lobby.canStartMediation ||
    isPending ||
    waitingForOpposite ||
    handshakeStarting ||
    handshake?.status === "started";

  return (
    <PortalPageShell flowStep={flowStep}>
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
              ready={lobby.self.mediationReady}
              readyLabel={t.mediationStatusReady}
            />
          </div>

          <div className="rounded border border-hair border-t-[3px] border-t-party-b bg-surface-container p-6">
            <h2 className="mb-4 font-display text-headline-md text-ink">{t.mediationOppositeSide}</h2>
            <p className="mb-3 font-sans text-body-sm text-on-surface-variant">{t.roles[oppositeRole]}</p>
            {lobby.opposite ? (
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
          {!lobby.bothReady ? (
            <div className="flex w-full items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container p-4">
              <span className="material-symbols-outlined mt-1 text-tertiary">info</span>
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationOppositeNotReady}</p>
            </div>
          ) : null}

          {lobby.pipelineRunning ? (
            <div className="flex w-full items-start gap-3 rounded border border-law-line bg-law-fill p-4">
              <span className="material-symbols-outlined mt-1 animate-spin text-tertiary">progress_activity</span>
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationAgentsWorking}</p>
            </div>
          ) : null}

          {lobby.preparingMediationRoom ? (
            <div className="flex w-full items-start gap-3 rounded border border-law-line bg-law-fill p-4">
              <span className="material-symbols-outlined mt-1 animate-spin text-tertiary">progress_activity</span>
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationRoomPreparing}</p>
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

          {handshakeStarting ? (
            <div className="flex w-full items-start gap-3 rounded border border-law-line bg-law-fill p-4">
              <span className="material-symbols-outlined mt-1 animate-spin text-tertiary">progress_activity</span>
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationHandshakeStarting}</p>
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
