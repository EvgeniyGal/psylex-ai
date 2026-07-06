"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={cn("flex items-center gap-2 text-[13px] font-medium", className)}>
      <button
        className={cn(
          "rounded-full px-2 py-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-law",
          locale === "en" ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
        )}
        onClick={() => setLocale("en")}
        type="button"
      >
        EN
      </button>
      <span className="text-hair">|</span>
      <button
        className={cn(
          "rounded-full px-2 py-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-law",
          locale === "uk" ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
        )}
        onClick={() => setLocale("uk")}
        type="button"
      >
        UA
      </button>
    </div>
  );
}
