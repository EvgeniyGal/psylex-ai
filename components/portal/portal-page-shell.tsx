"use client";

import { PortalHeader } from "@/components/portal/portal-header";
import { cn } from "@/lib/utils";

type PortalPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function PortalPageShell({ children, className }: PortalPageShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-surface-container-low font-sans text-on-background",
        className,
      )}
    >
      <PortalHeader />
      {children}
    </div>
  );
}
