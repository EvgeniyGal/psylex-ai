"use client";

import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { MediationCountdown } from "@/components/portal/mediation-countdown";
import { useLocale } from "@/components/locale-provider";
import type { getRoomPageData } from "@/lib/room/queries";

type RoomExperienceProps = {
  data: NonNullable<Awaited<ReturnType<typeof getRoomPageData>>>;
};

export function RoomExperience({ data }: RoomExperienceProps) {
  const { portal: t } = useLocale();
  const startedAt = data.room.mediationStartedAt?.toISOString();

  return (
    <PortalPageShell>
      <main className="mx-auto w-full max-w-3xl space-y-6 px-gutter py-stack-lg">
        <div>
          <h1 className="font-display text-display-lg text-on-surface">{t.roomTitle}</h1>
          <p className="text-body-md text-on-surface-variant">{data.room.title}</p>
        </div>

        {startedAt ? (
          <MediationCountdown
            durationMinutes={data.room.mediationDurationMinutes}
            startedAt={startedAt}
          />
        ) : null}

        <div className="glass-panel flex flex-col items-center justify-center rounded-xl p-12 text-center">
          <p className="mb-2 font-display text-headline-md text-on-surface-variant">{t.roomComingSoon}</p>
          <p className="max-w-md text-body-md text-on-surface-variant">{t.roomComingSoonDesc}</p>
        </div>
      </main>
    </PortalPageShell>
  );
}
