"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useState } from "react";
import { acceptDisclaimer } from "@/app/onboarding/actions";
import { FlowReviewNext } from "@/components/portal/flow-review-next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { useLocale } from "@/components/locale-provider";
import { getRoleCopy } from "@/lib/portal-i18n";
import type { ParticipantRole } from "@/lib/participant-roles";

type ProceedButtonProps = {
  consented: boolean;
  label: string;
  loadingLabel: string;
};

function ProceedButton({ consented, label, loadingLabel }: ProceedButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn-primary flex w-full max-w-xs items-center justify-center gap-2 px-8 py-4 font-display text-label-md transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={!consented || pending}
      type="submit"
    >
      {pending ? (
        <>
          <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </>
      )}
    </button>
  );
}

type DisclaimerConsentScreenProps = {
  role: ParticipantRole;
  review?: boolean;
};

export function DisclaimerConsentScreen({ role, review = false }: DisclaimerConsentScreenProps) {
  const { locale, portal: t } = useLocale();
  const roleCopy = getRoleCopy(role, locale);
  const [consented, setConsented] = useState(false);

  return (
    <PortalPageShell className="antialiased" flowStep={1}>
      <main className="relative flex flex-grow flex-col items-center justify-center p-gutter md:p-margin-desktop">
        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-stack-lg">
          <div className="space-y-stack-sm text-center">
            <span
              className="material-symbols-outlined mb-2 text-5xl text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              gavel
            </span>
            <h1 className="font-display text-display-lg text-on-surface">{t.disclaimerTitle}</h1>
            <p className="mx-auto max-w-xl font-sans text-body-lg text-on-surface-variant">
              {roleCopy.disclaimerIntro}
            </p>
          </div>

          <div className="ai-insight-border relative overflow-hidden rounded-r-md p-8">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined mt-1 shrink-0 text-law">info</span>
              <div className="space-y-4">
                <h2 className="font-display text-headline-md text-ink">{t.importantInfo}</h2>
                <div className="space-y-4 text-body-md leading-relaxed text-ink-soft">
                  {roleCopy.disclaimerParagraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className={paragraph.includes("confidential") ? "flex items-center gap-2 text-ink" : undefined}
                    >
                      {paragraph.includes("confidential") ? (
                        <>
                          <span className="material-symbols-outlined text-xl">lock</span>
                          {paragraph}
                        </>
                      ) : (
                        paragraph
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {review ? (
            <>
              <FlowReviewNext step={1} />
              <p className="text-center">
                <Link className="text-body-sm text-on-surface-variant underline" href="/room">
                  {t.flowReviewBackToCurrent}
                </Link>
              </p>
            </>
          ) : (
            <form
              action={acceptDisclaimer}
              className="flex flex-col items-center gap-stack-md rounded border border-hair bg-surface-container p-6"
            >
              <label className="group flex w-full max-w-md cursor-pointer items-center gap-4 rounded-md border border-hair bg-paper p-4 transition-colors hover:border-[#c9ced6]">
                <input
                  checked={consented}
                  className="consent-checkbox shrink-0"
                  name="consent"
                  onChange={(event) => setConsented(event.target.checked)}
                  required
                  type="checkbox"
                />
                <span className="select-none font-sans text-body-md text-on-surface transition-colors group-hover:text-primary">
                  {t.consentLabel}
                </span>
              </label>
              <ProceedButton consented={consented} label={t.proceed} loadingLabel={t.proceedLoading} />
              <div className="mt-2 flex items-center gap-2 font-sans text-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-base">shield_lock</span>
                {t.secureEnv}
              </div>
            </form>
          )}
        </div>
      </main>
    </PortalPageShell>
  );
}
