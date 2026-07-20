"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  clickMediatorStartMediation,
  fetchMediatorLobbyHandshake,
} from "@/app/mediator/rooms/actions";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import {
  formatCountdownMs,
  useScheduledSessionClock,
} from "@/hooks/use-scheduled-session-clock";
import { formatDateTime } from "@/lib/format-datetime";
import type { MediatorHandshakeState } from "@/lib/mediator-session/handshake";

type MediatorSessionLobbyProps = {
  roomId: string;
  roomTitle: string;
  initialHandshake: MediatorHandshakeState;
  partyUserIds?: string[];
};

export function MediatorSessionLobby({
  roomId,
  roomTitle,
  initialHandshake,
  partyUserIds = [],
}: MediatorSessionLobbyProps) {
  const { portal: t, admin, locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [handshake, setHandshake] = useState(initialHandshake);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMediatorLobbyHandshake(roomId);
      if (next) {
        setHandshake(next);
        if (next.status === "started") {
          router.push(`/mediator/rooms/${roomId}/session`);
        }
      }
    } catch {
      /* ignore */
    }
  }, [roomId, router]);

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

  const onStart = () => {
    startTransition(async () => {
      const next = await clickMediatorStartMediation(roomId);
      setHandshake(next);
      if (next.status === "started") {
        router.push(`/mediator/rooms/${roomId}/session`);
      }
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
    <section className="mx-auto max-w-2xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-body-sm font-semibold text-tertiary hover:text-on-surface"
        href={`/mediator/rooms/${roomId}`}
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        {admin.returnToRooms}
      </Link>

      <div className="glass-panel space-y-4 rounded-xl p-6">
        <h2 className="font-display text-headline-md text-on-surface">{roomTitle}</h2>
        <p className="text-body-sm text-on-surface-variant">{t.mediationLobbyTitle}</p>

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
    </section>
  );
}
