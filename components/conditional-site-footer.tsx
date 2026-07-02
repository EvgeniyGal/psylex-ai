"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";

/** Console / in-app surfaces — not onboarding or marketing pages. */
const HIDDEN_FOOTER_PREFIXES = ["/mediator", "/admin", "/room", "/dashboard"];

export function ConditionalSiteFooter() {
  const pathname = usePathname();
  const hideFooter = HIDDEN_FOOTER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (hideFooter) return null;
  return <SiteFooter />;
}
