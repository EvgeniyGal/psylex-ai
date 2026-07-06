"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";

type MediationCountdownProps = {
  startedAt: string;
  durationMinutes: number;
  onEnded?: () => void;
  /** When true, stop ticking and show session-ended (mediation finished before timer). */
  sessionComplete?: boolean;
};

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function MediationCountdown({
  startedAt,
  durationMinutes,
  onEnded,
  sessionComplete = false,
}: MediationCountdownProps) {
  const { portal: t } = useLocale();
  const endsAt = useMemo(
    () => new Date(startedAt).getTime() + durationMinutes * 60_000,
    [durationMinutes, startedAt],
  );
  // Defer time display until after mount to avoid SSR/client Date.now() hydration mismatch.
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (sessionComplete) return;

    const tick = () => setRemainingMs(Math.max(0, endsAt - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt, sessionComplete]);

  const ended = sessionComplete || (remainingMs !== null && remainingMs <= 0);

  useEffect(() => {
    if (ended) onEnded?.();
  }, [ended, onEnded]);

  return (
    <div className="glass-panel rounded-xl p-6 text-center">
      <p className="mb-2 font-display text-label-md uppercase text-on-surface-variant">{t.mediationCountdownLabel}</p>
      {ended ? (
        <p className="font-display text-display-md text-error">{t.mediationSessionEnded}</p>
      ) : (
        <p className="font-display text-display-lg tabular-nums text-tertiary" suppressHydrationWarning>
          {remainingMs === null ? "--:--" : formatRemaining(remainingMs)}
        </p>
      )}
    </div>
  );
}
