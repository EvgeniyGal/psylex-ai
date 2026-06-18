"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { completeOnboarding, markTestComplete } from "@/app/onboarding/actions";
import { PortalHeader } from "@/components/portal/portal-header";
import { useLocale } from "@/components/locale-provider";
import { getRoleCopy } from "@/lib/portal-i18n";
import type { ParticipantRole } from "@/lib/participant-roles";
import { buildTestUrl } from "@/lib/test-links";
import type { TestKey } from "@/lib/test-keys";

type TestDefinition = {
  key: TestKey;
  url: string;
  completed: boolean;
  unlocked: boolean;
};

type TestingDashboardProps = {
  role: ParticipantRole;
  login: string;
  tests: TestDefinition[];
  allComplete: boolean;
};

export function TestingDashboard({ role, login, tests, allComplete }: TestingDashboardProps) {
  const router = useRouter();
  const { locale, portal: t } = useLocale();
  const roleCopy = getRoleCopy(role, locale);
  const [isPending, startTransition] = useTransition();

  const openTest = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMarkComplete = (testKey: TestKey) => {
    startTransition(async () => {
      await markTestComplete(testKey);
      router.refresh();
    });
  };

  const handleNextStep = () => {
    startTransition(async () => {
      await completeOnboarding();
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-on-background">
      <PortalHeader />

      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col items-center justify-center px-margin-mobile py-stack-lg pt-28 md:px-margin-desktop">
        <div className="flex w-full max-w-2xl flex-col gap-stack-md">
          <div className="mb-4 text-center">
            <h1 className="mb-2 font-display text-display-lg">{roleCopy.testsTitle}</h1>
            <p className="font-sans text-body-lg text-on-surface-variant">{roleCopy.testsSubtitle}</p>
          </div>

          <div className="flex w-full flex-col gap-stack-sm">
            {tests.map((test) => {
              const meta = t.testMeta[test.key];
              const testUrl = buildTestUrl(test.url, login);
              const isActive = test.unlocked && !test.completed;
              const isLocked = !test.unlocked;

              return (
                <div
                  key={test.key}
                  className={`relative flex w-full items-center justify-between rounded-xl border border-white/10 bg-card p-6 text-left transition-all ${
                    isActive ? "test-card-active border-white/10" : ""
                  } ${isLocked ? "opacity-75" : "test-card"}`}
                >
                  {isActive ? <div className="absolute bottom-0 left-0 top-0 w-1 bg-tertiary" /> : null}
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-primary-container text-primary"
                          : isLocked
                            ? "bg-surface-container-lowest text-outline"
                            : "bg-surface-container-highest text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined">{meta.icon}</span>
                    </div>
                    <div>
                      <h3
                        className={`mb-1 font-display text-headline-md ${
                          isLocked ? "text-outline" : "text-on-surface"
                        }`}
                      >
                        {meta.title}
                      </h3>
                      <p
                        className={`font-sans text-body-sm ${
                          isActive
                            ? "text-primary"
                            : isLocked
                              ? "text-outline"
                              : "text-on-surface-variant"
                        }`}
                      >
                        {isLocked ? t.locked : isActive ? t.pendingCompletion : meta.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                    {test.unlocked && testUrl ? (
                      <button
                        className="font-sans text-body-sm text-tertiary underline transition-colors hover:text-primary"
                        onClick={() => openTest(testUrl)}
                        type="button"
                      >
                        {t.openTest}
                      </button>
                    ) : null}
                    {test.completed ? (
                      <div className="flex items-center gap-2 rounded border border-tertiary bg-tertiary/10 px-3 py-1 text-tertiary">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span className="font-display text-label-md uppercase">{t.passed}</span>
                      </div>
                    ) : test.unlocked ? (
                      <button
                        className="flex items-center gap-2 rounded border border-outline-variant bg-surface-container-highest px-3 py-1 text-on-surface-variant transition-colors hover:border-tertiary hover:text-tertiary"
                        disabled={isPending}
                        onClick={() => handleMarkComplete(test.key)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">pending</span>
                        <span className="font-display text-label-md uppercase">{t.markComplete}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1 text-outline">
                        <span className="material-symbols-outlined text-sm">lock</span>
                        <span className="font-display text-label-md uppercase">{t.notPassed}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-stack-md flex w-full flex-col items-center gap-stack-sm">
            <div className="flex w-full items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container p-4">
              <span className="material-symbols-outlined mt-1 text-tertiary">info</span>
              <p className="font-sans text-body-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">Hint:</span> {t.testsHint}
              </p>
            </div>
            <button
              className="btn-primary mt-4 w-full px-8 py-4 font-sans text-body-lg font-bold disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              disabled={!allComplete || isPending}
              onClick={handleNextStep}
              type="button"
            >
              {t.nextStep}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
