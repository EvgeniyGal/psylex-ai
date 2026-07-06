"use client";

import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function UplBanner({ className }: { className?: string }) {
  const { landing: t } = useLocale();

  return (
    <div
      className={cn(
        "border-b border-law-line bg-law-fill px-margin-mobile py-[7px] text-center text-[12.5px] leading-snug text-on-tertiary md:px-margin-desktop",
        className,
      )}
      role="note"
    >
      <b className="font-semibold">{t.uplBannerLead}</b>{" "}
      {t.uplBannerBody}
    </div>
  );
}
