"use client";

import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SiteHeader } from "@/components/site-header";
import { useLocale } from "@/components/locale-provider";

const beatBorders = ["border-t-med", "border-t-law", "border-t-risk"] as const;

function WorkflowSteps({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div className="flex gap-4" key={step.title}>
          <div className="font-display text-sm italic text-law">{index + 1}.</div>
          <div>
            <h4 className="font-display text-[15.5px] leading-snug text-ink">{step.title}</h4>
            <p className="mt-1 text-body-sm text-ink-soft">{step.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LandingPage() {
  const { landing: t } = useLocale();
  const beats = [
    { key: "b1", k: "01", title: t.win1, border: beatBorders[0] },
    { key: "b2", k: "02", title: t.win2, border: beatBorders[1] },
    { key: "b3", k: "03", title: t.win3, border: beatBorders[2] },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        showUplBanner
        trailing={
          <>
            <LocaleSwitcher />
            <Link
              className="hidden text-[13px] font-medium tracking-wide text-ink-soft transition-colors hover:text-ink md:block"
              href="/login"
            >
              {t.login}
            </Link>
          </>
        }
      />

      <main className="flex-grow px-margin-mobile py-6 md:px-margin-desktop md:py-10">
        <section className="mx-auto max-w-landing pt-6 md:pt-12">
          <h1 className="wordmark mb-2 text-center font-display text-display-lg text-ink">
            {t.headline}
            {t.headlineAccent ? (
              <>
                <br />
                <em className="text-law">{t.headlineAccent}</em>
              </>
            ) : null}
          </h1>

          <p className="mx-auto mb-6 max-w-[620px] text-center text-body-md text-ink-soft">{t.subheadline}</p>

          <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center gap-2.5 rounded-full border border-ink bg-ink px-[34px] py-[13px] text-base font-medium text-white transition-colors hover:bg-[#0f1a2e] active:translate-y-px"
              href="/login"
            >
              {t.start}
              <span className="font-display italic text-law-mark">→</span>
            </Link>
            <Link
              className="btn-secondary px-6 py-3 text-body-md sm:w-auto"
              href="/login"
            >
              {t.mediators}
            </Link>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {beats.map((beat) => (
              <div
                className={`rounded border border-hair border-t-[3px] bg-surface-container px-[18px] py-4 ${beat.border}`}
                key={beat.key}
              >
                <div className="mb-1 font-display text-sm italic text-ink-soft">{beat.k}</div>
                <h3 className="mb-1.5 font-display text-headline-md text-ink">{beat.title}</h3>
              </div>
            ))}
          </div>

          <p className="mx-auto mb-8 max-w-3xl text-center font-display text-lg italic text-ink-soft md:text-xl">
            {t.winFooter}
          </p>

          <div className="mx-auto max-w-[760px] rounded-r-[10px] border border-hair border-l-[3px] border-l-ink bg-[#F0F2F5] px-[18px] py-3.5 text-[12.5px] leading-snug text-ink-soft">
            <b className="font-semibold text-ink">{t.landingUplCardLead}</b>
            {t.landingUplCardBody}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-container-max">
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-5">
            <div className="rounded border border-hair border-t-[3px] border-t-party-a bg-surface-container p-5 lg:col-span-3">
              <h3 className="mb-4 text-center font-display text-headline-md text-ink">{t.psylexTitle}</h3>
              <ul className="mx-auto max-w-sm space-y-3">
                {t.psylexPoints.map((point) => (
                  <li className="flex items-start text-body-sm text-ink-soft" key={point}>
                    <span className="material-symbols-outlined mr-2 mt-0.5 text-base text-party-a">check</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded border border-hair border-t-[3px] border-t-risk bg-surface-container p-5 lg:col-span-2">
              <h3 className="mb-4 text-center font-display text-headline-md text-ink">{t.attorneyTitle}</h3>
              <ul className="mx-auto max-w-sm space-y-3">
                {t.attorneyPoints.map((point) => (
                  <li className="flex items-start text-body-sm text-ink-soft" key={point}>
                    <span className="material-symbols-outlined mr-2 mt-0.5 text-base text-risk">close</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-container-max" id="how-it-works">
          <div className="mb-3 flex items-center gap-2.5 text-eyebrow uppercase text-ink-soft">
            <span className="h-[7px] w-[7px] rounded-full bg-law" />
            <span>{t.howTitle}</span>
          </div>
          <h2 className="mb-8 font-display text-headline-lg text-ink">{t.howTitle}</h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded border border-hair border-t-[3px] border-t-party-b bg-surface-container p-5">
              <h3 className="mb-4 font-display text-headline-md text-ink">{t.modeA}</h3>
              <WorkflowSteps steps={t.modeASteps} />
            </div>
            <div className="rounded border border-hair border-t-[3px] border-t-med bg-surface-container p-5">
              <h3 className="mb-4 font-display text-headline-md text-ink">{t.modeB}</h3>
              <WorkflowSteps steps={t.modeBSteps} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
