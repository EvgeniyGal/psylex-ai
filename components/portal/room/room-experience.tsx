"use client";

import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { MediationRoom } from "@/components/portal/room/mediation-room";
import { useLocale } from "@/components/locale-provider";
import type { fetchMediationRoomState } from "@/app/(participant)/room/actions";

type RoomExperienceProps = {
  mediationState: NonNullable<Awaited<ReturnType<typeof fetchMediationRoomState>>>;
};

export function RoomExperience({ mediationState }: RoomExperienceProps) {
  const { portal: t } = useLocale();

  return (
    <PortalPageShell>
      <main className="mx-auto w-full max-w-3xl space-y-6 px-gutter py-stack-lg">
        <div>
          <h1 className="font-display text-display-lg text-on-surface">{t.roomTitle}</h1>
          <p className="text-body-md text-on-surface-variant">{mediationState.room.title}</p>
        </div>

        <MediationRoom
          initialState={mediationState}
          viewerRole={mediationState.viewerRole}
        />
      </main>
    </PortalPageShell>
  );
}
