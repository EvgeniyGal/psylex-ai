"use client";

import { useState } from "react";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { MediationRoom } from "@/components/portal/room/mediation-room";
import { useLocale } from "@/components/locale-provider";
import { resolveRoomFlowStep } from "@/lib/participant-flow";
import type { MediationPhase } from "@/lib/mediation/types";
import type { fetchMediationRoomState } from "@/app/(participant)/room/actions";

type RoomExperienceProps = {
  mediationState: NonNullable<Awaited<ReturnType<typeof fetchMediationRoomState>>>;
  review?: boolean;
};

export function RoomExperience({ mediationState, review = false }: RoomExperienceProps) {
  const { portal: t } = useLocale();
  const [phase, setPhase] = useState<MediationPhase | null>(mediationState.room.phase);
  const flowStep = resolveRoomFlowStep(phase, review);

  return (
    <PortalPageShell flowStep={flowStep}>
      <main className="mx-auto w-full max-w-3xl space-y-6 px-gutter py-stack-lg">
        <div>
          <h1 className="font-display text-display-lg text-on-surface">{t.roomTitle}</h1>
          <p className="text-body-md text-on-surface-variant">{mediationState.room.title}</p>
        </div>

        <MediationRoom
          initialState={mediationState}
          onPhaseChange={setPhase}
          review={review}
          viewerRole={mediationState.viewerRole}
        />
      </main>
    </PortalPageShell>
  );
}
