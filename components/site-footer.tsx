"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ReferenceFooter } from "@/components/reference-footer";
import type { FooterDemoMode } from "@/lib/footer-demo-mode";
import { isLandingFooterPath } from "@/lib/footer-demo-mode";

export function SiteFooter() {
  const pathname = usePathname();
  const [demoMode, setDemoMode] = useState<FooterDemoMode>("landing");

  useEffect(() => {
    if (isLandingFooterPath(pathname)) {
      setDemoMode("landing");
      return;
    }

    let cancelled = false;

    void fetch(`/api/footer-context?path=${encodeURIComponent(pathname)}`)
      .then((response) => response.json())
      .then((data: { demoMode?: FooterDemoMode }) => {
        if (!cancelled && data.demoMode) {
          setDemoMode(data.demoMode);
        }
      })
      .catch(() => {
        if (!cancelled) setDemoMode("landing");
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div className="relative z-10 mt-auto w-full px-margin-mobile py-8 md:px-margin-desktop">
      <ReferenceFooter demoMode={demoMode} />
    </div>
  );
}
