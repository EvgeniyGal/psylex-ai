"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  fetchMediatorSchedulingReadiness,
  saveMediatorSchedule,
} from "@/app/mediator/rooms/actions";
import { ScheduleFields } from "@/components/mediator/schedule-fields";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";
import { useRoomRealtime } from "@/hooks/use-room-realtime";
import { formatDateTime } from "@/lib/format-datetime";
import {
  normalizeDuration,
  partsToIso,
  toScheduleParts,
} from "@/lib/mediator-session/schedule-form";
import {
  DEFAULT_SCHEDULE_DURATION_MINUTES,
  type ScheduleDurationOption,
  type ScheduleMinuteOption,
} from "@/lib/mediator-session/schedule-options";

type SessionSchedulingSectionProps = {
  roomId: string;
  readOnly?: boolean;
  initialScheduledStartAt?: string | null;
  initialDurationMinutes?: number;
  mediationStarted?: boolean;
  partyUserIds?: string[];
};

export function SessionSchedulingSection({
  roomId,
  readOnly = false,
  initialScheduledStartAt = null,
  initialDurationMinutes = DEFAULT_SCHEDULE_DURATION_MINUTES,
  mediationStarted = false,
  partyUserIds = [],
}: SessionSchedulingSectionProps) {
  const { admin, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const initialParts = useMemo(() => toScheduleParts(initialScheduledStartAt), [initialScheduledStartAt]);
  const [date, setDate] = useState(initialParts?.date ?? "");
  const [hour, setHour] = useState(initialParts?.hour ?? "");
  const [minute, setMinute] = useState<ScheduleMinuteOption>(initialParts?.minute ?? 0);
  const [durationMinutes, setDurationMinutes] = useState<ScheduleDurationOption>(
    normalizeDuration(initialDurationMinutes),
  );
  const [scheduledStartAt, setScheduledStartAt] = useState(initialScheduledStartAt);
  const [partyAReady, setPartyAReady] = useState(false);
  const [partyBReady, setPartyBReady] = useState(false);
  const [pipelineComplete, setPipelineComplete] = useState(false);
  const [canSchedule, setCanSchedule] = useState(false);
  const [started, setStarted] = useState(mediationStarted);

  const scheduleIso = useMemo(
    () => partsToIso({ date, hour, minute }),
    [date, hour, minute],
  );

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
        setDurationMinutes(normalizeDuration(data.mediationDurationMinutes));
        if (data.scheduledStartAt) {
          const parts = toScheduleParts(data.scheduledStartAt);
          if (parts) {
            setDate(parts.date);
            setHour(parts.hour);
            setMinute(parts.minute);
          }
        }
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
    if (!scheduleIso) return;
    startTransition(async () => {
      try {
        await saveMediatorSchedule(roomId, scheduleIso, durationMinutes);
        setScheduledStartAt(scheduleIso);
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
        <div className="space-y-2">
          <div>
            <p className="mb-1 text-body-sm text-on-surface-variant">{admin.scheduleDateTimeLabel}</p>
            <p className="text-body-md text-on-surface">
              {scheduledStartAt ? formatDateTime(new Date(scheduledStartAt), locale) : admin.scheduleNotSet}
            </p>
          </div>
          <div>
            <p className="mb-1 text-body-sm text-on-surface-variant">{admin.scheduleDurationLabel}</p>
            <p className="text-body-md text-on-surface">
              {admin.scheduleDurationOption(durationMinutes)}
            </p>
          </div>
        </div>
      ) : (
        <>
          {!(partyAReady && partyBReady && pipelineComplete) ? (
            <p className="text-body-sm text-on-surface-variant">{admin.scheduleStartRequiresReadyHint}</p>
          ) : null}

          <ScheduleFields
            date={date}
            disabled={!canSchedule || pending}
            durationMinutes={durationMinutes}
            hour={hour}
            idPrefix={`room-${roomId}`}
            minute={minute}
            onDateChange={setDate}
            onDurationChange={setDurationMinutes}
            onHourChange={setHour}
            onMinuteChange={setMinute}
          />

          <button
            className="btn-primary flex items-center gap-1.5 px-5 py-2 text-body-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canSchedule || !scheduleIso || pending}
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
            className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-body-sm font-semibold"
            href={`/mediator/rooms/${roomId}/lobby`}
          >
            <span className="material-symbols-outlined text-[20px]">meeting_room</span>
            {admin.scheduleOpenLobby}
          </Link>
        ) : null}
        {!readOnly && started ? (
          <Link
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-body-sm font-semibold shadow-sm"
            href={`/mediator/rooms/${roomId}/session`}
          >
            <span className="material-symbols-outlined text-[20px]">videocam</span>
            {admin.scheduleOpenSession}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
