"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/locale-provider";

export function PortalHeader() {
  const { portal: t } = useLocale();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-outline-variant/10 bg-surface-container-high shadow-sm">
      <div className="mx-auto flex h-20 w-full max-w-container-max items-center justify-between gap-4 px-margin-mobile md:px-margin-desktop">
        <Link
          className="font-display text-headline-md font-bold tracking-tight text-tertiary transition-opacity hover:opacity-80"
          href="/"
        >
          {t.brand}
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <LocaleSwitcher />
          <button
            className="flex items-center gap-1.5 rounded-lg border border-outline-variant/30 px-3 py-2 font-sans text-body-sm text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary"
            onClick={() => signOut({ callbackUrl: "/" })}
            type="button"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
