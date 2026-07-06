"use client";

import { PortalHeader } from "@/components/portal/portal-header";
import { ParticipantStepRail } from "@/components/portal/participant-step-rail";
import type { ParticipantFlowStepId } from "@/lib/participant-flow";
import { cn } from "@/lib/utils";

type PortalPageShellProps = {
  children: React.ReactNode;
  className?: string;
  flowStep?: ParticipantFlowStepId;
  showStepRail?: boolean;
};

export function PortalPageShell({ children, className, flowStep, showStepRail }: PortalPageShellProps) {
  const railVisible = showStepRail ?? (flowStep !== undefined && flowStep > 0);

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-paper font-sans text-ink",
        className,
      )}
    >
      <PortalHeader />
      {railVisible && flowStep !== undefined ? (
        <ParticipantStepRail currentStep={flowStep} />
      ) : null}
      {children}
    </div>
  );
}
