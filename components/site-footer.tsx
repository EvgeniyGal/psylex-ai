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
    <footer className="relative z-10 mt-auto w-full bg-surface-container-lowest py-stack-lg">
      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-stack-md px-margin-mobile md:grid-cols-2 md:px-margin-desktop">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Image alt="PsyLex" className="h-8 w-auto" height={32} src="/logo.webp" unoptimized width={32} />
            <span className="font-display text-headline-md text-primary">PsyLex</span>
          </div>
          <p className="max-w-md text-body-sm text-on-surface-variant">{t.disclaimer}</p>
          <p className="mt-auto text-body-sm text-on-surface-variant">© 2026 AI Innovation Management LLC</p>
        </div>
        <nav className="flex flex-col gap-2 md:items-end md:text-right">
          <a className="text-body-md text-on-surface-variant transition-colors hover:text-tertiary" href="#">
            {t.footerLinks.disclaimer}
          </a>
          <a className="text-body-md text-on-surface-variant transition-colors hover:text-tertiary" href="#">
            {t.footerLinks.privacy}
          </a>
          <Link
            className="text-body-md text-on-surface-variant transition-colors hover:text-tertiary"
            href="/#how-it-works"
          >
            {t.footerLinks.howItWorks}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
