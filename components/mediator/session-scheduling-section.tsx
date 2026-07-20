"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  fetchMediatorSchedulingReadiness,
  saveMediatorSchedule,
} from "@/app/mediator/rooms/actions";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { formatDateTime } from "@/lib/format-datetime";

type SessionSchedulingSectionProps = {
  roomId: string;
  readOnly?: boolean;
  initialScheduledStartAt?: string | null;
  mediationStarted?: boolean;
  partyUserIds?: string[];
};

function toLocalInputValue(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SessionSchedulingSection({
  roomId,
  readOnly = false,
  initialScheduledStartAt = null,
  mediationStarted = false,
  partyUserIds = [],
}: SessionSchedulingSectionProps) {
  const { admin, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const [localValue, setLocalValue] = useState(toLocalInputValue(initialScheduledStartAt));
  const [scheduledStartAt, setScheduledStartAt] = useState(initialScheduledStartAt);
  const [partyAReady, setPartyAReady] = useState(false);
  const [partyBReady, setPartyBReady] = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [canSchedule, setCanSchedule] = useState(false);
  const [started, setStarted] = useState(mediationStarted);

  const refreshReadiness = useCallback(() => {
    if (readOnly) return;
    void fetchMediatorSchedulingReadiness(roomId)
      .then((data) => {
        if (!data) return;
        setPartyAReady(data.partyAReady);
        setPartyBReady(data.partyBReady);
        setPipelineComplete(data.pipelineComplete);
        setCanSchedule(data.canSchedule);
        setScheduledStartAt(data.scheduledStartAt);
        setLocalValue((current) =>
          data.scheduledStartAt ? toLocalInputValue(data.scheduledStartAt) : current,
        );
        setStarted(data.mediationStarted);
      })
      .catch(() => {
        /* ignore */
      });
  }, [readOnly, roomId]);

  useEffect(() => {
    refreshReadiness();
  }, [refreshReadiness]);

  useRoomRealtime(roomId, () => {
    refreshReadiness();
  }, {
    enabled: !readOnly,
    watchUsers: true,
    partyUserIds,
  });

  const onSave = () => {
    if (!localValue) return;
    const iso = new Date(localValue).toISOString();
    startTransition(async () => {
      try {
        await saveMediatorSchedule(roomId, iso);
        setScheduledStartAt(iso);
        toast.success(admin.scheduleSaved);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : admin.scheduleError);
      }
    });
  };

  const readinessRow = (label: string, ready: boolean) => (
    <div className="flex items-center justify-between gap-3 text-body-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className={ready ? "text-success" : "text-error"}>
        {ready ? admin.scheduleReady : admin.scheduleNotReady}
      </span>
    </div>
  );

  return (
    <div className="glass-panel space-y-4 rounded-xl p-6">
      <h4 className="font-display text-headline-md text-on-surface">{admin.scheduleSectionTitle}</h4>

      {readOnly ? null : (
        <div className="space-y-2 rounded-md bg-surface-container-low/60 p-3">
          {readinessRow(admin.scheduleReadinessPartyA, partyAReady)}
          {readinessRow(admin.scheduleReadinessPartyB, partyBReady)}
          {readinessRow(admin.scheduleReadinessPipeline, pipelineComplete)}
        </div>
      )}

      {readOnly || started ? (
        <div>
          <p className="mb-1 text-body-sm text-on-surface-variant">{admin.scheduleDateTimeLabel}</p>
          <p className="text-body-md text-on-surface">
            {scheduledStartAt ? formatDateTime(new Date(scheduledStartAt), locale) : admin.scheduleNotSet}
          </p>
        </div>
      ) : (
        <>
          {!(partyAReady && partyBReady && pipelineComplete) ? (
            <p className="text-body-sm text-on-surface-variant">{admin.scheduleStartRequiresReadyHint}</p>
          ) : null}
          <div>
            <label className="mb-1 block text-body-sm text-on-surface-variant" htmlFor="scheduled-start">
              {admin.scheduleDateTimeLabel}
            </label>
            <input
              className="w-full rounded-md border border-hair bg-paper px-3 py-2 text-ink focus:border-law focus:outline-none focus:ring-1 focus:ring-law"
              disabled={!canSchedule || pending}
              id="scheduled-start"
              onChange={(event) => setLocalValue(event.target.value)}
              type="datetime-local"
              value={localValue}
            />
          </div>
          <button
            className="btn-primary flex items-center gap-1.5 px-5 py-2 text-body-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canSchedule || !localValue || pending}
            onClick={onSave}
            type="button"
          >
            {pending ? <Spinner className="text-white" size="sm" /> : admin.scheduleSave}
          </button>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        {!readOnly && scheduledStartAt && !started ? (
          <Link
            className="inline-flex items-center gap-1 text-body-sm font-semibold text-tertiary hover:underline"
            href={`/mediator/rooms/${roomId}/lobby`}
          >
            {admin.scheduleOpenLobby}
          </Link>
        ) : null}
        {!readOnly && started ? (
          <Link
            className="inline-flex items-center gap-1 text-body-sm font-semibold text-tertiary hover:underline"
            href={`/mediator/rooms/${roomId}/session`}
          >
            {admin.scheduleOpenSession}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
