"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Locale, copy } from "@/lib/i18n";
import { detectLocale, LOCALE_CHANGE_EVENT, setStoredLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function WorkflowSteps({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <div className="relative space-y-8">
      {steps.map((step, index) => (
        <div className="relative flex gap-6" key={step.title}>
          <div className="flex flex-col items-center">
            <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-tertiary bg-primary-container font-bold text-tertiary">
              {index + 1}
            </div>
            {index < steps.length - 1 ? (
              <div className="absolute top-8 h-full w-0.5 bg-tertiary/30" />
            ) : null}
          </div>
          <div className={index < steps.length - 1 ? "pb-8" : ""}>
            <h4 className="mb-1 font-bold">{step.title}</h4>
            <p className="text-body-md text-on-surface-variant">{step.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LandingPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const value = detectLocale();
    setLocale(value);
    const onChange = () => setLocale(detectLocale());
    window.addEventListener(LOCALE_CHANGE_EVENT, onChange);

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const t = useMemo(() => copy[locale], [locale]);

  const handleLocale = (next: Locale) => {
    setLocale(next);
    setStoredLocale(next);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={cn(
          "sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md transition-shadow",
          scrolled && "shadow-md",
        )}
        id="topAppBar"
      >
        <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center gap-3">
            <Image alt="PsyLex" className="h-8 w-auto" height={32} src="/stitch/logo.png" width={120} />
            <span className="font-display text-headline-md font-bold text-primary">PsyLex</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-label-md">
              <button
                className={cn(locale === "en" ? "font-bold text-tertiary" : "text-primary-fixed-dim")}
                onClick={() => handleLocale("en")}
                type="button"
              >
                EN
              </button>
              <span className="text-outline-variant">|</span>
              <button
                className={cn(
                  locale === "uk" ? "font-bold text-tertiary" : "text-primary-fixed-dim hover:text-tertiary",
                )}
                onClick={() => handleLocale("uk")}
                type="button"
              >
                UA
              </button>
            </div>
            <Link
              className="hidden text-label-md text-primary-fixed-dim transition-opacity hover:opacity-80 md:block"
              href="/login"
            >
              {t.login}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="relative flex min-h-[80vh] items-center overflow-hidden bg-primary-container pb-stack-lg pt-stack-lg">
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <div className="absolute h-[80vw] w-[80vw] max-h-[800px] max-w-[800px] rounded-full bg-tertiary/20 blur-[120px] mix-blend-screen" />
            <Image
              alt="Cinematic Prism Resolution"
              className="absolute inset-0 z-10 h-full w-full object-cover opacity-40 mix-blend-screen"
              fill
              priority
              src="/stitch/prism-concept.png"
            />
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-primary-container to-transparent" />
          </div>
          <div className="relative z-30 mx-auto w-full max-w-container-max px-margin-mobile text-center md:px-margin-desktop">
            <h1 className="mx-auto mb-stack-md max-w-5xl font-display text-[40px] font-bold leading-tight tracking-tight text-on-surface md:text-[64px]">
              {t.headline}
              <br />
              <span className="text-tertiary">{t.headlineAccent}</span>
            </h1>
            <p className="mx-auto mb-stack-lg max-w-2xl text-body-lg text-on-surface-variant">{t.subheadline}</p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link className="btn-primary w-full px-8 py-4 text-body-md transition-opacity hover:opacity-90 sm:w-auto" href="/login">
                {t.start}
              </Link>
              <Link
                className="btn-secondary w-full px-8 py-4 text-body-md transition-colors hover:bg-tertiary hover:text-primary-container sm:w-auto"
                href="/login"
              >
                {t.mediators}
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-surface py-stack-lg">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <div className="mb-stack-md grid grid-cols-1 gap-gutter md:grid-cols-3">
              {[t.win1, t.win2, t.win3].map((item, i) => (
                <div className="card-glow flex flex-col items-center rounded-xl p-stack-md text-center" key={item}>
                  <span
                    className="material-symbols-outlined mb-4 text-4xl text-tertiary"
                    style={{ fontVariationSettings: i < 2 ? "'FILL' 1" : undefined }}
                  >
                    {i < 2 ? "check_circle" : "draw"}
                  </span>
                  <p className="text-body-md text-on-surface">{item}</p>
                </div>
              ))}
            </div>
            <p className="mx-auto max-w-3xl text-center text-body-md italic text-on-surface-variant md:text-2xl">
              {t.winFooter}
            </p>
          </div>
        </section>

        <section className="bg-[#F5F7FA] py-stack-lg">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-1 gap-stack-lg lg:grid-cols-5">
              <div className="relative overflow-hidden rounded-xl border border-[#2A3D66] bg-primary-container p-stack-md shadow-lg lg:col-span-3">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-tertiary opacity-10 blur-2xl" />
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-tertiary/30 bg-card">
                  <span className="material-symbols-outlined text-3xl text-tertiary">handshake</span>
                </div>
                <h3 className="mb-stack-sm text-center font-display text-headline-md text-tertiary">{t.psylexTitle}</h3>
                <ul className="relative z-10 mx-auto max-w-sm space-y-4">
                  {t.psylexPoints.map((point) => (
                    <li className="flex items-start text-body-md text-on-surface" key={point}>
                      <span className="material-symbols-outlined mr-3 mt-1 text-tertiary">check</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-stack-md shadow-sm lg:col-span-2">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <span className="material-symbols-outlined text-3xl text-primary-container">gavel</span>
                </div>
                <h3 className="mb-stack-sm text-center font-display text-headline-md text-primary-container">
                  {t.attorneyTitle}
                </h3>
                <ul className="mx-auto max-w-sm space-y-4">
                  {t.attorneyPoints.map((point) => (
                    <li className="flex items-start text-body-md text-primary-container" key={point}>
                      <span className="material-symbols-outlined mr-3 mt-1 text-error">close</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary-container py-stack-lg text-on-surface" id="how-it-works">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-margin-desktop">
            <h2 className="mb-stack-lg text-center font-display text-headline-lg">{t.howTitle}</h2>
            <div className="grid grid-cols-1 gap-stack-lg lg:grid-cols-2">
              <div className="rounded-xl border border-tertiary/20 bg-surface-container-high/30 p-stack-md">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary text-primary-container">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <h3 className="font-display text-headline-md text-tertiary">{t.modeA}</h3>
                </div>
                <WorkflowSteps steps={t.modeASteps} />
              </div>
              <div className="rounded-xl border border-tertiary/20 bg-surface-container-high/30 p-stack-md">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary text-primary-container">
                    <span className="material-symbols-outlined">groups</span>
                  </div>
                  <h3 className="font-display text-headline-md text-tertiary">{t.modeB}</h3>
                </div>
                <WorkflowSteps steps={t.modeBSteps} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto w-full bg-surface-container-lowest py-stack-lg">
        <div className="mx-auto grid max-w-container-max grid-cols-1 gap-stack-md px-margin-mobile md:grid-cols-2 md:px-margin-desktop">
          <div className="flex flex-col gap-4">
            <span className="font-display text-headline-md text-primary">PsyLex</span>
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
            <a className="text-body-md text-on-surface-variant transition-colors hover:text-tertiary" href="#how-it-works">
              {t.footerLinks.howItWorks}
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
