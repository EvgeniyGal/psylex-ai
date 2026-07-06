"use client";

import { signOut, useSession } from "next-auth/react";
import { PortalLocaleSwitcher } from "@/components/portal/portal-locale-switcher";
import { useLocale } from "@/components/locale-provider";
import { SiteHeader } from "@/components/site-header";
import { isPartyRole } from "@/lib/participant-roles";

export function PortalHeader() {
  const { portal: t } = useLocale();
  const { data: session } = useSession();
  const showUplBanner = isPartyRole(session?.user?.role ?? "");

  return (
    <SiteHeader
      showUplBanner={showUplBanner}
      trailing={
        <>
          <PortalLocaleSwitcher />
          <button
            className="flex items-center gap-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
            onClick={() => signOut({ callbackUrl: "/" })}
            type="button"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </>
      }
    />
  );
}
