"use client";

import { signOut, useSession } from "next-auth/react";
import { PortalLocaleSwitcher } from "@/components/portal/portal-locale-switcher";
import { useLocale } from "@/components/locale-provider";
import { SiteHeader } from "@/components/site-header";
import { isPartyRole, type PartyRole } from "@/lib/participant-roles";

export function PortalHeader() {
  const { portal: t } = useLocale();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const showUplBanner = isPartyRole(role);
  const partyLabel = isPartyRole(role) ? t.roles[role as PartyRole] : null;

  return (
    <SiteHeader
      showUplBanner={showUplBanner}
      trailing={
        <>
          {partyLabel ? (
            <span className="rounded-full border border-hair bg-surface-container px-3 py-1 font-display text-label-md uppercase tracking-wide text-on-surface">
              {partyLabel}
            </span>
          ) : null}
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
