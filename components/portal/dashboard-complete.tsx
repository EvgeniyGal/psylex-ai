"use client";

import Link from "next/link";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { useLocale } from "@/components/locale-provider";

export function DashboardComplete() {
  const { portal: t } = useLocale();

  return (
    <PortalPageShell>
      <main className="flex flex-grow flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg space-y-6">
          <span
            className="material-symbols-outlined text-5xl text-tertiary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <h1 className="font-display text-display-lg text-on-surface">{t.dashboardTitle}</h1>
          <p className="font-sans text-body-lg text-on-surface-variant">{t.dashboardBody}</p>
          <Link
            className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 font-display text-label-md"
            href="/room"
          >
            {t.dashboardEnterRoom}
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </main>
    </PortalPageShell>
  );
}
