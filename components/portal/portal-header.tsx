"use client";

import { signOut } from "next-auth/react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/locale-provider";
import { SiteHeader } from "@/components/site-header";

export function PortalHeader() {
  const { portal: t } = useLocale();

  return (
    <SiteHeader
      trailing={
        <>
          <LocaleSwitcher />
          <button
            className="flex items-center gap-1.5 text-label-md text-primary-fixed-dim transition-opacity hover:opacity-80"
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
