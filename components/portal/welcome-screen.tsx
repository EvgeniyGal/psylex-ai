"use client";

import { markWelcomeSeen } from "@/app/onboarding/actions";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { useLocale } from "@/components/locale-provider";
import { getRoleCopy } from "@/lib/portal-i18n";
import type { ParticipantRole } from "@/lib/participant-roles";

type WelcomeScreenProps = {
  role: ParticipantRole;
};

export function WelcomeScreen({ role }: WelcomeScreenProps) {
  const { locale, portal: t } = useLocale();
  const roleCopy = getRoleCopy(role, locale);

  return (
    <PortalPageShell>
      <main className="relative flex flex-grow items-center justify-center px-margin-mobile pb-12 md:px-margin-desktop">
        <div className="relative z-10 max-w-2xl space-y-stack-lg text-center">
          <div className="space-y-stack-md">
            <div className="mb-3 flex items-center justify-center gap-2.5 text-eyebrow uppercase text-ink-soft">
              <span className="h-[7px] w-[7px] rounded-full bg-law" />
              <span>PsyLex</span>
            </div>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-md border border-hair bg-surface-container">
              <span
                className="material-symbols-outlined text-3xl text-law"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychology
              </span>
            </div>
            <h1 className="font-display text-display-lg text-ink">{roleCopy.welcomeTitle}</h1>
            <p className="mx-auto max-w-xl text-body-lg text-ink-soft">{roleCopy.welcomeBody}</p>
          </div>

          <div className="pt-8">
            <form action={markWelcomeSeen}>
              <button
                className="btn-primary mx-auto flex items-center gap-2 px-8 py-4"
                type="submit"
              >
                {roleCopy.welcomeCta}
                <span className="font-display italic text-law-mark">→</span>
              </button>
            </form>
            <p className="mt-4 flex items-center justify-center gap-2 text-body-sm text-ink-soft">
              <span className="material-symbols-outlined text-xs">lock</span>
              {t.confidential}
            </p>
          </div>
        </div>
      </main>
    </PortalPageShell>
  );
}
