"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMediationRoomState } from "@/app/(participant)/room/actions";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { MediationRoom } from "@/components/portal/room/mediation-room";
import { useLocale } from "@/components/locale-provider";
import { resolveRoomFlowStep } from "@/lib/participant-flow";
import { cn } from "@/lib/utils";
import type { MediationPhase } from "@/lib/mediation/types";

type MediationRoomState = NonNullable<Awaited<ReturnType<typeof fetchMediationRoomState>>>;

type RoomExperienceProps = {
  mediationState: MediationRoomState | null;
  roomTitle: string;
  review?: boolean;
};

export function RoomExperience({ mediationState, roomTitle, review = false }: RoomExperienceProps) {
  const router = useRouter();
  const { portal: t } = useLocale();
  const [phase, setPhase] = useState<MediationPhase | null>(mediationState?.room.phase ?? null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (mediationState) return;

    let cancelled = false;
    let timeoutId: number | undefined;

    const poll = async () => {
      try {
        const next = await fetchMediationRoomState();
        if (cancelled) return;
        if (next) {
          if (!refreshingRef.current) {
            refreshingRef.current = true;
            router.refresh();
          }
          return;
        }
      } catch {
        // retry on transient errors
      }

      if (!cancelled && !refreshingRef.current) {
        timeoutId = window.setTimeout(() => {
          void poll();
        }, 2000);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [mediationState, router]);

  if (!mediationState) {
    const flowStep = resolveRoomFlowStep(null, review);

    return (
      <PortalPageShell flowStep={flowStep}>
        <main className="mx-auto flex w-full max-w-2xl flex-grow flex-col items-center justify-center gap-4 px-margin-mobile py-stack-lg md:px-margin-desktop">
          <span className="material-symbols-outlined animate-spin text-4xl text-tertiary">progress_activity</span>
          <div className="text-center">
            <h1 className="mb-2 font-display text-display-lg text-on-surface">{t.roomTitle}</h1>
            <p className="font-sans text-body-lg text-on-surface-variant">{roomTitle}</p>
            <p className="mt-4 font-sans text-body-sm text-on-surface-variant">{t.mediationPreparing}</p>
          </div>
        </main>
      </PortalPageShell>
    );
  }

  const flowStep = resolveRoomFlowStep(phase, review);
  const isTreatyView = phase === "completed" && !review;

  return (
    <PortalPageShell flowStep={flowStep}>
      <main
        className={cn(
          "mx-auto w-full space-y-6 px-gutter py-stack-lg",
          isTreatyView ? "max-w-container-max" : "max-w-3xl",
        )}
      >
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
