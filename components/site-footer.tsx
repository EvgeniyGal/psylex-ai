"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/locale-provider";

export function SiteFooter() {
  const pathname = usePathname();
  const { landing: t } = useLocale();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="relative z-10 mt-auto w-full border-t border-hair bg-paper py-8">
      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-6 px-margin-mobile md:grid-cols-2 md:px-margin-desktop">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Image alt="PsyLex" className="h-7 w-auto" height={28} src="/logo.webp" unoptimized width={28} />
            <span className="wordmark font-display text-[17px] text-ink">PsyLex</span>
          </div>
          <p className="max-w-md text-[12px] text-ink-soft">{t.disclaimer}</p>
          <p className="mt-auto text-[12px] text-ink-soft">© 2026 AI Innovation Management LLC</p>
        </div>
        <nav className="flex flex-col gap-2 md:items-end md:text-right">
          <a className="text-body-sm text-ink-soft transition-colors hover:text-ink" href="#">
            {t.footerLinks.disclaimer}
          </a>
          <a className="text-body-sm text-ink-soft transition-colors hover:text-ink" href="#">
            {t.footerLinks.privacy}
          </a>
          <Link
            className="text-body-sm text-ink-soft transition-colors hover:text-ink"
            href="/#how-it-works"
          >
            {t.footerLinks.howItWorks}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
