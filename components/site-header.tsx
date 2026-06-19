"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
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

const headerSurfaceClass = "bg-surface/90 backdrop-blur-md transition-shadow";

type SiteHeaderProps = {
  brandHref?: string;
  className?: string;
  fixed?: boolean;
  trailing?: ReactNode;
};

export function SiteHeader({
  brandHref = "/",
  className,
  fixed = false,
  trailing,
}: SiteHeaderProps) {
  const scrolled = useHeaderScrolled();

  return (
    <header
      className={cn(
        "top-0 z-50 w-full",
        headerSurfaceClass,
        fixed ? "fixed" : "sticky",
        scrolled && "shadow-md",
        "border-b border-outline-variant/10",
        className,
      )}
      id="topAppBar"
    >
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link className="flex items-center gap-3 transition-opacity hover:opacity-90" href={brandHref}>
          <Image alt="PsyLex" className="h-8 w-auto" height={32} src="/stitch/logo.png" width={120} />
          <span className="font-display text-headline-md font-bold text-primary">PsyLex</span>
        </Link>
        {trailing ? <div className="flex items-center gap-6">{trailing}</div> : null}
      </div>
    </header>
  );
}

export function siteHeaderSurfaceClassName(scrolled: boolean, className?: string) {
  return cn(headerSurfaceClass, scrolled && "shadow-md", className);
}
