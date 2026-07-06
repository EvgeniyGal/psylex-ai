"use client";

import { AdminSidebar, AdminTopBar } from "@/components/admin/admin-shell";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper font-sans text-body-md text-ink">
        <AdminSidebar />
        <AdminTopBar />
        <main className="relative ml-64 min-h-screen overflow-hidden px-gutter pb-stack-lg pt-20">
          <div className="relative z-10 mx-auto max-w-container-max">{children}</div>
      </main>
    </div>
  );
}
