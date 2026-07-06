"use client";

import { useLocale } from "@/components/locale-provider";
import type { FooterDemoMode } from "@/lib/footer-demo-mode";
import { cn } from "@/lib/utils";

function Sep() {
  return <span className="text-hair">·</span>;
}

type ReferenceFooterProps = {
  demoMode: FooterDemoMode;
  className?: string;
};

export function ReferenceFooter({ demoMode, className }: ReferenceFooterProps) {
  const { landing: t } = useLocale();

  const demoLabel =
    demoMode === "landing"
      ? t.footerDemoLanding
      : demoMode === "modeA"
        ? t.footerDemoModeA
        : t.footerDemoModeB;

  return (
    <footer
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 text-center text-[12px] text-ink-soft",
        className,
      )}
    >
      <span>{t.footerCompany}</span>
      <Sep />
      <span>{t.footerFounder}</span>
      <Sep />
      <span>{t.footerPatent}</span>
      <Sep />
      <span>{demoLabel}</span>
    </footer>
  );
}
