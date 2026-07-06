"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { UplBanner } from "@/components/upl-banner";
import { cn } from "@/lib/utils";

export function useHeaderScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

const headerSurfaceClass =
  "border-b border-hair bg-surface-container transition-shadow";

type SiteHeaderProps = {
  brandHref?: string;
  className?: string;
  fixed?: boolean;
  showUplBanner?: boolean;
  trailing?: ReactNode;
};

export function SiteHeader({
  brandHref = "/",
  className,
  fixed = false,
  showUplBanner = false,
  trailing,
}: SiteHeaderProps) {
  const scrolled = useHeaderScrolled();

  return (
    <header
      className={cn(
        "top-0 z-50 w-full",
        headerSurfaceClass,
        fixed ? "fixed" : "sticky",
        scrolled && "shadow-sm",
        className,
      )}
      id="topAppBar"
    >
      <div className="mx-auto flex h-14 max-w-container-max items-center justify-between gap-4 px-margin-mobile md:px-margin-desktop">
        <Link className="flex items-center gap-2.5 transition-opacity hover:opacity-90" href={brandHref}>
          <Image alt="PsyLex" className="h-7 w-auto" height={28} src="/logo.webp" unoptimized width={28} />
          <span className="flex items-center gap-2.5 text-[13px] font-medium uppercase tracking-[0.12em] text-ink-soft">
            <span className="h-[7px] w-[7px] rounded-full bg-law" />
            <span className="wordmark text-[17px] normal-case tracking-[0.02em] text-ink">PsyLex</span>
          </span>
        </Link>
        {trailing ? <div className="flex items-center gap-4">{trailing}</div> : null}
      </div>
      {showUplBanner ? <UplBanner /> : null}
    </header>
  );
}

export function siteHeaderSurfaceClassName(scrolled: boolean, className?: string) {
  return cn(headerSurfaceClass, scrolled && "shadow-sm", className);
}
