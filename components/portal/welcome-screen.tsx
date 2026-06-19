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
    <PortalPageShell className="relative overflow-x-hidden">
      <main className="relative flex flex-grow items-center justify-center px-margin-mobile pb-12 md:px-margin-desktop">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(38,65,116,0.4)_0%,rgba(0,18,52,0)_70%)]" />

        <div className="relative z-10 max-w-2xl space-y-stack-lg text-center">
          <div className="space-y-stack-md">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface-container-highest shadow-lg">
              <span
                className="material-symbols-outlined text-3xl text-tertiary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                psychology
              </span>
            </div>
            <h1 className="font-display text-display-lg text-on-surface">{roleCopy.welcomeTitle}</h1>
            <p className="mx-auto max-w-xl font-sans text-body-lg leading-relaxed text-on-surface-variant">
              {roleCopy.welcomeBody}
            </p>
          </div>

          <div className="pt-8">
            <form action={markWelcomeSeen}>
              <button
                className="btn-primary mx-auto flex items-center gap-2 px-8 py-4 font-display text-label-md transition-transform hover:scale-105 active:scale-95"
                type="submit"
              >
                {roleCopy.welcomeCta}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </form>
            <p className="mt-4 flex items-center justify-center gap-2 font-sans text-body-sm text-outline">
              <span className="material-symbols-outlined text-xs">lock</span>
              {t.confidential}
            </p>
          </div>
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-1/3 w-full bg-gradient-to-t from-surface-container-highest/20 to-transparent" />
    </PortalPageShell>
  );
}
