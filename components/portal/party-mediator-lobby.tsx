"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clickStartMediation, runPostIntakePipelineForRoom } from "@/app/dispute-intake/actions";
import { getMediatorPartyHandshakeAction } from "@/app/mediator/rooms/party-actions";
import { PartyActionBanner } from "@/components/portal/party-action-banner";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { usePartyActionNotifications } from "@/hooks/use-party-action-notifications";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import {
  formatCountdownMs,
  useScheduledSessionClock,
} from "@/hooks/use-scheduled-session-clock";
import { formatDateTime } from "@/lib/format-datetime";
import type { MediatorHandshakeState } from "@/lib/mediator-session/handshake";
import type { PartyNotification } from "@/lib/mediator-session/types";
import type { PartyRole } from "@/lib/participant-roles";
import type { ParticipantFlowStepId } from "@/lib/participant-flow";

type PartyMediatorLobbyProps = {
  roomId: string;
  roomTitle: string;
  viewerRole: PartyRole;
  flowStep: ParticipantFlowStepId;
  initialHandshake: MediatorHandshakeState;
  pipelineRunning: boolean;
  bothReady: boolean;
  partyUserIds?: string[];
};

export function PartyMediatorLobby({
  roomId,
  roomTitle,
  viewerRole,
  flowStep,
  initialHandshake,
  pipelineRunning,
  bothReady,
  partyUserIds = [],
}: PartyMediatorLobbyProps) {
  const { portal: t, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [handshake, setHandshake] = useState(initialHandshake);
  const [notification, setNotification] = useState<PartyNotification | null>(null);

  const { banner, clearBanner } = usePartyActionNotifications({
    notification,
    viewerRole,
  });

  const refresh = useCallback(async () => {
    try {
      const next = await getMediatorPartyHandshakeAction();
      if (!next) return;
      const { partyNotification, ...hs } = next;
      setHandshake(hs);
      if (partyNotification) setNotification(partyNotification);
      if (hs.status === "started") {
        router.push("/room");
      }
    } catch {
      /* ignore */
    }
  }, [router]);

  useRoomRealtime(roomId, () => {
    void refresh();
  }, {
    watchUsers: true,
    partyUserIds,
  });

  const { msUntilStart, msUntilStartWindow } = useScheduledSessionClock(
    handshake.scheduledStartAt,
    () => {
      void refresh();
    },
    handshake.status !== "started",
  );

  useEffect(() => {
    if (bothReady && pipelineRunning) {
      void runPostIntakePipelineForRoom(roomId);
    }
  }, [bothReady, pipelineRunning, roomId]);

  const onStart = () => {
    startTransition(async () => {
      await clickStartMediation();
      await refresh();
    });
  };

  const waitingLabels = [
    !handshake.partyAClicked ? t.modeBWaitingPartyA : null,
    !handshake.partyBClicked ? t.modeBWaitingPartyB : null,
    !handshake.mediatorClicked ? t.modeBWaitingMediator : null,
  ].filter(Boolean);

  const showStartWindowCountdown =
    handshake.status === "too_early" && msUntilStartWindow !== null && msUntilStartWindow > 0;
  const showSessionCountdown =
    (handshake.status === "countdown" ||
      (handshake.status === "waiting" && handshake.selfClicked)) &&
    msUntilStart !== null &&
    msUntilStart > 0;

  return (
    <PortalPageShell flowStep={flowStep}>
      <div className="mx-auto max-w-2xl space-y-6 px-margin-mobile py-stack-md md:px-margin-desktop">
        <h1 className="font-display text-headline-md text-on-surface">{roomTitle}</h1>
        <PartyActionBanner message={banner} onDismiss={clearBanner} />

        <div className="glass-panel space-y-4 rounded-xl p-6">
          <h2 className="font-display text-headline-md text-on-surface">{t.mediationLobbyTitle}</h2>

          {handshake.scheduledStartAt ? (
            <p className="text-body-sm text-on-surface-variant">
              {t.modeBScheduledAt}: {formatDateTime(new Date(handshake.scheduledStartAt), locale)}
            </p>
          ) : (
            <p className="text-body-sm text-on-surface-variant">{t.modeBWaitingSchedule}</p>
          )}

          {showStartWindowCountdown ? (
            <p className="font-display text-headline-sm tabular-nums text-tertiary" suppressHydrationWarning>
              {t.modeBStartWindowOpens}: {formatCountdownMs(msUntilStartWindow)}
            </p>
          ) : null}

          {showSessionCountdown ? (
            <>
              <p className="font-display text-headline-sm tabular-nums text-tertiary" suppressHydrationWarning>
                {t.modeBCountdownToStart}: {formatCountdownMs(msUntilStart)}
              </p>
              {handshake.status === "countdown" ? (
                <p className="text-body-sm text-on-surface-variant">{t.modeBAllReadyCountdown}</p>
              ) : null}
            </>
          ) : null}

          {handshake.status === "waiting" && waitingLabels.length > 0 ? (
            <ul className="space-y-1 text-body-sm text-on-surface-variant">
              {waitingLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          ) : null}

          {handshake.selfClicked && handshake.status !== "started" ? (
            <p className="text-body-sm text-success">{t.mediationHandshakeWaiting}</p>
          ) : null}

          <div className="space-y-2">
            <button
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-body-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!handshake.canClickStart || pending || handshake.selfClicked}
              onClick={onStart}
              type="button"
            >
              {pending ? <Spinner className="text-white" size="sm" /> : null}
              {t.mediationStart}
            </button>
            {handshake.scheduledStartAt && handshake.status !== "started" ? (
              <p className="text-body-sm text-on-surface-variant">{t.modeBStartAvailableHint}</p>
            ) : null}
          </div>
        </div>
      </div>
    </PortalPageShell>
  );
}
