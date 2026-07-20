"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";

type SessionElapsedTimerProps = {
  startedAt: string;
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SessionElapsedTimer({ startedAt }: SessionElapsedTimerProps) {
  const { portal: t } = useLocale();
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsedMs(Math.max(0, Date.now() - start));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return (
    <div className="glass-panel rounded-xl p-4 text-center">
      <p className="mb-1 font-display text-label-md uppercase text-on-surface-variant">
        {t.mediationElapsedLabel}
      </p>
      <p className="font-display text-display-md tabular-nums text-tertiary" suppressHydrationWarning>
        {elapsedMs === null ? "--:--" : formatElapsed(elapsedMs)}
      </p>
    </div>
  );
}
