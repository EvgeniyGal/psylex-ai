"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={cn("flex items-center gap-2 text-label-md", className)}>
      <button
        className={cn(locale === "en" ? "font-bold text-tertiary" : "text-primary-fixed-dim")}
        onClick={() => setLocale("en")}
        type="button"
      >
        EN
      </button>
      <span className="text-outline-variant">|</span>
      <button
        className={cn(
          locale === "uk" ? "font-bold text-tertiary" : "text-primary-fixed-dim hover:text-tertiary",
        )}
        onClick={() => setLocale("uk")}
        type="button"
      >
        UA
      </button>
    </div>
  );
}
