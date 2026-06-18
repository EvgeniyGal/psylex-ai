"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { completeOnboarding, updateTestStatus } from "@/app/onboarding/actions";
import { PortalHeader } from "@/components/portal/portal-header";
import { useLocale } from "@/components/locale-provider";
import { getRoleCopy } from "@/lib/portal-i18n";
import type { ParticipantRole } from "@/lib/participant-roles";
import { buildTestUrl } from "@/lib/test-links";
import type { TestKey } from "@/lib/test-keys";

const STATUS_POLL_INTERVAL_MS = 30 * 60 * 1000;

const openTestButtonClass =
  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded border border-tertiary bg-tertiary/15 px-3 py-1 text-tertiary transition-colors hover:bg-tertiary/25";
const passedBadgeClass =
  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded border border-success bg-success/10 px-3 py-1 text-success";
const failedBadgeClass =
  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded border border-error bg-error/10 px-3 py-1 text-error";
const testActionsColumnClass =
  "flex w-[320px] shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end";

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
  testsComplete: boolean;
  personalBotReady: boolean;
  canProceed: boolean;
};

export function TestingDashboard({
  role,
  login,
  tests,
  testsComplete,
  personalBotReady,
  canProceed,
}: TestingDashboardProps) {
  const router = useRouter();
  const { locale, portal: t } = useLocale();
  const roleCopy = getRoleCopy(role, locale);
  const [isPending, startTransition] = useTransition();

  const openTest = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpdateStatus = () => {
    startTransition(async () => {
      await updateTestStatus();
      router.refresh();
    });
  };

  const handleNextStep = () => {
    startTransition(async () => {
      await completeOnboarding();
    });
  };

  useEffect(() => {
    if (canProceed) return;

    const intervalId = window.setInterval(() => {
      startTransition(async () => {
        await updateTestStatus();
        router.refresh();
      });
    }, STATUS_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [canProceed, router]);

  const showUpdateTestButton = !testsComplete;
  const showUpdateBotButton = testsComplete && !personalBotReady;

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-on-background">
      <PortalHeader />

      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col items-center justify-center px-margin-mobile py-stack-lg pt-28 md:px-margin-desktop">
        <div className="flex w-full max-w-4xl flex-col gap-stack-md">
          <div className="mb-4 text-center">
            <h1 className="mb-2 font-display text-display-lg">{roleCopy.testsTitle}</h1>
            <p className="font-sans text-body-lg text-on-surface-variant">{roleCopy.testsSubtitle}</p>
          </div>

          <div className="flex w-full flex-col gap-stack-sm">
            {tests.map((test) => {
              const meta = t.testMeta[test.key];
              const testUrl = buildTestUrl(test.url, login);
              const isLocked = !test.unlocked;

              return (
                <div
                  key={test.key}
                  className="test-card relative flex w-full items-center gap-4 rounded-xl border border-white/10 bg-card p-6 text-left transition-all"
                >
                  <div
                    className={`absolute bottom-0 left-0 top-0 w-1 ${
                      test.completed ? "bg-success" : "bg-error"
                    }`}
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        test.completed
                          ? "bg-success/15 text-success"
                          : "bg-error/15 text-error"
                      }`}
                    >
                      <span className="material-symbols-outlined">{meta.icon}</span>
                    </div>
                    <div>
                      <h3 className="mb-1 font-display text-headline-md text-on-surface">
                        {meta.title}
                      </h3>
                      <p
                        className={`font-sans text-body-sm ${
                          test.completed ? "text-on-surface-variant" : "text-error"
                        }`}
                      >
                        {test.completed ? meta.subtitle : t.pendingCompletion}
                      </p>
                    </div>
                  </div>

                  <div className={testActionsColumnClass}>
                    {!test.completed && testUrl ? (
                      <button
                        className={openTestButtonClass}
                        onClick={() => openTest(testUrl)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        <span className="font-display text-label-md uppercase">{t.openTest}</span>
                      </button>
                    ) : null}
                    {test.completed ? (
                      <div className={passedBadgeClass}>
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span className="font-display text-label-md uppercase">{t.passed}</span>
                      </div>
                    ) : (
                      <div className={failedBadgeClass}>
                        <span className="material-symbols-outlined text-sm">
                          {isLocked ? "lock" : "pending"}
                        </span>
                        <span className="font-display text-label-md uppercase">{t.notPassed}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="test-card relative flex w-full items-center gap-4 rounded-xl border border-white/10 bg-card p-6 text-left transition-all">
              <div
                className={`absolute bottom-0 left-0 top-0 w-1 ${
                  personalBotReady ? "bg-success" : "bg-error"
                }`}
              />
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    personalBotReady
                      ? "bg-success/15 text-success"
                      : "bg-error/15 text-error"
                  }`}
                >
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <h3 className="mb-1 font-display text-headline-md text-on-surface">
                    {t.personalBoardTitle}
                  </h3>
                  <p
                    className={`font-sans text-body-sm ${
                      personalBotReady
                        ? "text-on-surface-variant"
                        : testsComplete
                          ? "text-error"
                          : "text-outline"
                    }`}
                  >
                    {personalBotReady
                      ? t.personalBoardReadySubtitle
                      : testsComplete
                        ? t.personalBoardPendingSubtitle
                        : t.personalBoardLockedSubtitle}
                  </p>
                </div>
              </div>

              <div className={testActionsColumnClass}>
                {personalBotReady ? (
                  <div className={passedBadgeClass}>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span className="font-display text-label-md uppercase">{t.personalBoardReady}</span>
                  </div>
                ) : (
                  <div className={failedBadgeClass}>
                    <span className="material-symbols-outlined text-sm">
                      {testsComplete ? "hourglass_top" : "lock"}
                    </span>
                    <span className="font-display text-label-md uppercase">{t.personalBoardPending}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-stack-md flex w-full flex-col items-center gap-stack-sm">
            <div className="flex w-full items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container p-4">
              <span className="material-symbols-outlined mt-1 text-tertiary">info</span>
              <p className="font-sans text-body-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">Hint:</span> {t.testsHint}
              </p>
            </div>
            {showUpdateTestButton ? (
              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-highest px-6 py-3 font-sans text-body-md text-on-surface transition-colors hover:border-tertiary hover:text-tertiary disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                disabled={isPending}
                onClick={handleUpdateStatus}
                type="button"
              >
                <span className="material-symbols-outlined text-base">sync</span>
                {t.updateTestStatus}
              </button>
            ) : null}
            {showUpdateBotButton ? (
              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-highest px-6 py-3 font-sans text-body-md text-on-surface transition-colors hover:border-tertiary hover:text-tertiary disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                disabled={isPending}
                onClick={handleUpdateStatus}
                type="button"
              >
                <span className="material-symbols-outlined text-base">smart_toy</span>
                {t.updateBotStatus}
              </button>
            ) : null}
            <button
              className="btn-primary mt-4 w-full px-8 py-4 font-sans text-body-lg font-bold disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
              disabled={!canProceed || isPending}
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
