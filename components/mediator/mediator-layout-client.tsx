"use client";

import { MediatorSidebar, MediatorTopBar } from "@/components/mediator/mediator-shell";

export function MediatorLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface font-sans text-body-md text-on-surface">
      <MediatorSidebar />
      <MediatorTopBar />
      <main className="relative ml-64 min-h-screen overflow-hidden px-gutter pb-stack-lg pt-24">
        <div className="pointer-events-none absolute -right-64 -top-64 h-[600px] w-[600px] rounded-full bg-tertiary/5 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-container-max">{children}</div>
      </main>
    </div>
  );
}
