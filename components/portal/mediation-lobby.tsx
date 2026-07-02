"use client";

import { useTransition } from "react";
import { startMediation } from "@/app/dispute-intake/actions";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { useLocale } from "@/components/locale-provider";
import type { SideReadiness } from "@/lib/dispute-intake";
import type { ParticipantRole } from "@/lib/participant-roles";

type MediationLobbyProps = {
  roomTitle: string;
  self: SideReadiness;
  opposite: SideReadiness | null;
  oppositeRole: "side1" | "side2";
  bothReady: boolean;
  viewerRole: ParticipantRole;
};

function StatusBadge({ ready, readyLabel, notReadyLabel }: { ready: boolean; readyLabel: string; notReadyLabel: string }) {
  return (
    <div
      className={
        ready
          ? "flex items-center gap-2 rounded border border-success bg-success/10 px-3 py-2 text-success"
          : "flex items-center gap-2 rounded border border-error bg-error/10 px-3 py-2 text-error"
      }
    >
      <span className="material-symbols-outlined text-sm">{ready ? "check_circle" : "pending"}</span>
      <span className="font-display text-label-md uppercase">{ready ? readyLabel : notReadyLabel}</span>
    </div>
  );
}

export function MediationLobby({
  roomTitle,
  self,
  opposite,
  oppositeRole,
  bothReady,
  viewerRole,
}: MediationLobbyProps) {
  const { portal: t } = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleStart = () => {
    startTransition(async () => {
      await startMediation();
    });
  };

  const oppositeReady = !!opposite?.mediationReady;

  return (
    <PortalPageShell>
      <main className="mx-auto flex w-full max-w-2xl flex-grow flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-display-lg text-on-surface">{t.mediationLobbyTitle}</h1>
          <p className="font-sans text-body-lg text-on-surface-variant">{roomTitle}</p>
          <p className="mt-2 font-sans text-body-sm text-on-surface-variant">{t.mediationLobbySubtitle}</p>
        </div>

        <div className="flex flex-col gap-stack-sm">
          <div className="rounded-xl border border-white/10 bg-card p-6">
            <h2 className="mb-4 font-display text-headline-md text-on-surface">{t.mediationYourStatus}</h2>
            <p className="mb-3 font-sans text-body-sm text-on-surface-variant">{t.roles[viewerRole]}</p>
            <StatusBadge
              notReadyLabel={t.mediationStatusNotReady}
              ready={self.mediationReady}
              readyLabel={t.mediationStatusReady}
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-card p-6">
            <h2 className="mb-4 font-display text-headline-md text-on-surface">{t.mediationOppositeSide}</h2>
            <p className="mb-3 font-sans text-body-sm text-on-surface-variant">{t.roles[oppositeRole]}</p>
            {opposite ? (
              <StatusBadge
                notReadyLabel={t.mediationStatusNotReady}
                ready={oppositeReady}
                readyLabel={t.mediationStatusReady}
              />
            ) : (
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationOppositeNotReady}</p>
            )}
          </div>
        </div>

        <div className="mt-stack-md flex flex-col items-center gap-stack-sm">
          {!bothReady ? (
            <div className="flex w-full items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container p-4">
              <span className="material-symbols-outlined mt-1 text-tertiary">info</span>
              <p className="font-sans text-body-sm text-on-surface-variant">{t.mediationOppositeNotReady}</p>
            </div>
          ) : null}

          <button
            className="btn-primary flex w-full items-center justify-center gap-2 px-8 py-4 font-display text-label-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            disabled={!bothReady || isPending}
            onClick={handleStart}
            type="button"
          >
            {isPending ? (
              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-xl">gavel</span>
            )}
            {t.mediationStart}
          </button>
        </div>
      </main>
    </PortalPageShell>
  );
}
