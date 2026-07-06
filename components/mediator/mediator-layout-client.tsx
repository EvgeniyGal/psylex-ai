"use client";

import { MediatorSidebar } from "@/components/mediator/mediator-shell";

export function MediatorLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper font-sans text-body-md text-ink">
      <MediatorSidebar />
      <main className="relative ml-64 min-h-screen overflow-hidden px-gutter pb-stack-lg pt-stack-md">
        <div className="relative z-10 mx-auto max-w-container-max">{children}</div>
      </main>
    </div>
  );
}
