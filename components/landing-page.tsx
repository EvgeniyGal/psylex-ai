"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Locale, copy, localeStorageKey } from "@/lib/i18n";

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(localeStorageKey);
  if (saved === "en" || saved === "uk") return saved;
  return navigator.language.toLowerCase().startsWith("uk") ? "uk" : "en";
}

export function LandingPage() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const value = detectLocale();
    setLocale(value);
    window.localStorage.setItem(localeStorageKey, value);
  }, []);

  const t = useMemo(() => copy[locale], [locale]);

  const handleLocale = (next: Locale) => {
    setLocale(next);
    window.localStorage.setItem(localeStorageKey, next);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
      <header className="mb-8 flex items-center justify-between">
        <div className="text-xl font-semibold">PsyLex</div>
        <div className="rounded-full border border-white/20 p-1">
          <button
            className={`rounded-full px-3 py-1 text-sm ${locale === "en" ? "bg-white/20" : ""}`}
            onClick={() => handleLocale("en")}
            type="button"
          >
            EN
          </button>
          <button
            className={`rounded-full px-3 py-1 text-sm ${locale === "uk" ? "bg-white/20" : ""}`}
            onClick={() => handleLocale("uk")}
            type="button"
          >
            UK
          </button>
        </div>
      </header>

      <section className="grid gap-8 rounded-3xl border border-white/10 bg-card p-8 md:grid-cols-2">
        <div className="space-y-5">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">{t.headline}</h1>
          <p className="text-lg text-muted">{t.subheadline}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className="rounded-xl bg-accent px-5 py-3 font-semibold text-black">
              {t.start}
            </Link>
            <Link href="/login" className="rounded-xl border border-white/25 px-5 py-3 font-semibold">
              {t.mediators}
            </Link>
          </div>
        </div>
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-900 via-slate-900 to-amber-700 p-6">
          <div className="absolute left-3 top-1/2 h-1 w-24 -translate-y-1/2 rounded bg-sky-300/80 blur-sm" />
          <div className="absolute right-3 top-1/2 h-1 w-24 -translate-y-1/2 rounded bg-purple-300/80 blur-sm" />
          <div className="mx-auto h-28 w-20 rotate-6 rounded-lg border border-white/20 bg-white/15" />
          <div className="mx-auto mt-4 h-1 w-40 animate-pulse rounded bg-accent" />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold">{t.contrastTitle}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {t.contrast.map(([left, right]) => (
            <div key={left} className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-card p-4">
              <div>{left}</div>
              <div className="font-semibold text-accent">{right}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold">{t.winwinTitle}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[t.win1, t.win2, t.win3].map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-card p-4">
              {item}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">{t.winFooter}</p>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold">{t.howTitle}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-card p-5">
            <h3 className="mb-3 text-lg font-semibold">{t.modeA}</h3>
            <ol className="list-decimal space-y-2 pl-5 text-muted">
              {t.modeASteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-5">
            <h3 className="mb-3 text-lg font-semibold">{t.modeB}</h3>
            <ol className="list-decimal space-y-2 pl-5 text-muted">
              {t.modeBSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <footer className="mt-14 border-t border-white/10 py-8 text-sm text-muted">
        <div className="mb-2 font-semibold text-text">PsyLex</div>
        <div className="mb-2 flex gap-4">
          <span>Disclaimer</span>
          <span>Privacy</span>
          <span>How it works</span>
        </div>
        <div>© 2026 AI Innovation Management LLC</div>
        <p>{t.disclaimer}</p>
      </footer>
    </main>
  );
}
