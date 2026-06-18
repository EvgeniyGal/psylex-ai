"use client";

import { useState } from "react";
import { acceptDisclaimer } from "@/app/onboarding/actions";
import { PortalHeader } from "@/components/portal/portal-header";
import { useLocale } from "@/components/locale-provider";
import { getRoleCopy } from "@/lib/portal-i18n";
import type { ParticipantRole } from "@/lib/participant-roles";

type DisclaimerConsentScreenProps = {
  role: ParticipantRole;
};

export function DisclaimerConsentScreen({ role }: DisclaimerConsentScreenProps) {
  const { locale, portal: t } = useLocale();
  const roleCopy = getRoleCopy(role, locale);
  const [consented, setConsented] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-on-background antialiased">
      <PortalHeader />

      <main className="relative flex flex-grow flex-col items-center justify-center p-gutter md:p-margin-desktop">
        <div className="absolute inset-0 z-0 bg-background/80 backdrop-blur-sm" />
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

          <div className="card-glow relative overflow-hidden rounded-xl p-8 mediation-highlight">
            <div className="absolute left-0 top-0 h-full w-1 bg-tertiary" />
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined mt-1 shrink-0 text-tertiary">info</span>
              <div className="space-y-4">
                <h2 className="font-display text-headline-md text-on-surface">{t.importantInfo}</h2>
                <div className="space-y-4 font-sans text-body-md leading-relaxed text-on-surface-variant">
                  {roleCopy.disclaimerParagraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className={paragraph.includes("confidential") ? "flex items-center gap-2 text-primary" : undefined}
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

          <form
            action={acceptDisclaimer}
            className="flex flex-col items-center gap-stack-md rounded-xl border border-outline-variant/10 bg-surface-container-high p-6 shadow-sm"
          >
            <label className="group flex w-full max-w-md cursor-pointer items-center gap-4 rounded-lg border border-outline-variant/20 bg-surface p-4 transition-colors hover:border-tertiary/50">
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
            <button
              className="btn-primary flex w-full max-w-xs items-center justify-center gap-2 px-8 py-4 font-display text-label-md transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!consented}
              type="submit"
            >
              {t.proceed}
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
            <div className="mt-2 flex items-center gap-2 font-sans text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-base">shield_lock</span>
              {t.secureEnv}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
