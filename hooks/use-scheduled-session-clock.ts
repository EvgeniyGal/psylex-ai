"use client";

import { useEffect, useMemo, useState } from "react";
import { START_BUTTON_LEAD_MS } from "@/lib/mediator-session/constants";
import { useDeadlineRefresh } from "@/hooks/use-room-realtime";

/**
 * Local countdown for Mode B scheduled start (UI-only).
 * Server refresh is triggered at start-window open and scheduled start via useDeadlineRefresh.
 */
export function useScheduledSessionClock(
  scheduledStartAt: string | null | undefined,
  onDeadline: () => void,
  enabled = true,
) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !scheduledStartAt) {
      setNow(null);
      return;
    }
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [enabled, scheduledStartAt]);

  const scheduledMs = useMemo(() => {
    if (!scheduledStartAt) return null;
    const ms = new Date(scheduledStartAt).getTime();
    return Number.isNaN(ms) ? null : ms;
  }, [scheduledStartAt]);

  const windowOpensAtIso = useMemo(() => {
    if (scheduledMs === null) return null;
    return new Date(scheduledMs - START_BUTTON_LEAD_MS).toISOString();
  }, [scheduledMs]);

  useDeadlineRefresh(windowOpensAtIso, onDeadline, enabled && !!windowOpensAtIso);
  useDeadlineRefresh(scheduledStartAt, onDeadline, enabled && !!scheduledStartAt);

  const msUntilStart =
    scheduledMs !== null && now !== null ? Math.max(0, scheduledMs - now) : null;
  const msUntilStartWindow =
    scheduledMs !== null && now !== null
      ? Math.max(0, scheduledMs - START_BUTTON_LEAD_MS - now)
      : null;

  return { msUntilStart, msUntilStartWindow, now };
}

export function formatCountdownMs(ms: number | null) {
  if (ms === null) return "--:--";
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
