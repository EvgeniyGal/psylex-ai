"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { completeOnboarding, updateTestStatus } from "@/app/onboarding/actions";
import { FlowReviewNext } from "@/components/portal/flow-review-next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { useLocale } from "@/components/locale-provider";
import { getRoleCopy } from "@/lib/portal-i18n";
import type { ParticipantRole } from "@/lib/participant-roles";
import { buildTestUrl } from "@/lib/test-links";
import type { TestKey } from "@/lib/test-keys";

const STATUS_POLL_INTERVAL_MS = 30 * 60 * 1000;

const openTestButtonClass =
  "flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-hair bg-surface-container px-3 py-2 text-ink transition-colors hover:border-[#c9ced6] sm:w-auto sm:shrink-0 sm:justify-start sm:py-1";
const passedBadgeClass =
  "flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-party-a-line bg-party-a-fill px-3 py-2 text-party-a sm:w-auto sm:shrink-0 sm:justify-start sm:py-1";
const failedBadgeClass =
  "flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-risk-line bg-risk-fill px-3 py-2 text-risk sm:w-auto sm:shrink-0 sm:justify-start sm:py-1";
const testCardClass =
  "test-card relative flex w-full flex-col gap-4 rounded border border-hair border-t-[3px] border-t-law bg-surface-container p-6 text-left transition-all sm:flex-row sm:items-center";
const testActionsClass =
  "flex w-full flex-col items-stretch gap-2 border-t border-hair pt-4 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:justify-end sm:border-t-0 sm:pt-0";
const testActionsEndClass =
  "flex w-full flex-col items-stretch gap-2 border-t border-hair pt-4 sm:w-auto sm:shrink-0 sm:flex-row sm:items-center sm:justify-end sm:border-t-0 sm:pt-0";

type TestDefinition = {
  key: TestKey;
  url: string;
  completed: boolean;
};

type TestingDashboardProps = {
  role: ParticipantRole;
  login: string;
  tests: TestDefinition[];
  testsComplete: boolean;
  personalBotReady: boolean;
  canProceed: boolean;
  flowStep: 2;
  review?: boolean;
};

export function TestingDashboard({
  role,
  login,
  tests,
  testsComplete,
  personalBotReady,
  canProceed,
  flowStep,
  review = false,
}: TestingDashboardProps) {
  const router = useRouter();
  const { locale, portal: t } = useLocale();
  const roleCopy = getRoleCopy(role, locale);
  const [isUpdatePending, startUpdateTransition] = useTransition();
  const [isNextStepPending, startNextStepTransition] = useTransition();

  const openTest = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpdateStatus = () => {
    startUpdateTransition(async () => {
      await updateTestStatus();
      router.refresh();
    });
  };

  const handleNextStep = () => {
    startNextStepTransition(async () => {
      await completeOnboarding();
    });
  };

  useEffect(() => {
    if (review || canProceed) return;

    const intervalId = window.setInterval(async () => {
      await updateTestStatus();
      router.refresh();
    }, STATUS_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [canProceed, review, router]);

  const showUpdateTestButton = !review && !testsComplete;
  const showUpdateBotButton = !review && testsComplete && !personalBotReady;

  return (
    <PortalPageShell flowStep={flowStep}>
      <main className="mx-auto flex w-full max-w-container-max flex-grow flex-col items-center justify-center px-margin-mobile py-stack-lg md:px-margin-desktop">
        <div className="flex w-full max-w-4xl flex-col gap-stack-md">
          <div className="mb-4 text-center">
            <h1 className="mb-2 font-display text-display-lg">{roleCopy.testsTitle}</h1>
            <p className="font-sans text-body-lg text-on-surface-variant">{roleCopy.testsSubtitle}</p>
          </div>

          <div className="flex w-full flex-col gap-stack-sm">
            {tests.map((test) => {
              const meta = t.testMeta[test.key];
              const testUrl = buildTestUrl(test.url, login);
              const showOpenTest = !review && !test.completed && !!testUrl;

              return (
                <div key={test.key} className={testCardClass}>
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

                  <div className={showOpenTest ? testActionsClass : testActionsEndClass}>
                    {showOpenTest ? (
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
                        <span className="material-symbols-outlined text-sm">pending</span>
                        <span className="font-display text-label-md uppercase">{t.notPassed}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className={testCardClass}>
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

              <div className={testActionsEndClass}>
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
            {!review ? (
              <div className="flex w-full items-start gap-3 rounded-lg border border-outline-variant/20 bg-surface-container p-4">
                <span className="material-symbols-outlined mt-1 text-tertiary">info</span>
                <p className="font-sans text-body-sm text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Hint:</span> {t.testsHint}
                </p>
              </div>
            ) : null}
            {showUpdateTestButton ? (
              <button
                className="btn-secondary flex w-full items-center justify-center gap-2 px-6 py-3 text-body-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                disabled={isUpdatePending}
                onClick={handleUpdateStatus}
                type="button"
              >
                {isUpdatePending ? (
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-base">sync</span>
                )}
                {isUpdatePending ? t.proceedLoading : t.updateTestStatus}
              </button>
            ) : null}
            {showUpdateBotButton ? (
              <button
                className="btn-secondary flex w-full items-center justify-center gap-2 px-6 py-3 text-body-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                disabled={isUpdatePending}
                onClick={handleUpdateStatus}
                type="button"
              >
                {isUpdatePending ? (
                  <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                )}
                {isUpdatePending ? t.proceedLoading : t.updateBotStatus}
              </button>
            ) : null}
            {review ? (
              <>
                <FlowReviewNext step={2} />
                <p className="text-center">
                  <Link className="text-body-sm text-on-surface-variant underline" href="/room">
                    {t.flowReviewBackToCurrent}
                  </Link>
                </p>
              </>
            ) : (
              <button
                className="btn-primary mt-4 flex w-full items-center justify-center gap-2 px-8 py-4 font-sans text-body-lg font-bold disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                disabled={!canProceed || isNextStepPending}
                onClick={handleNextStep}
                type="button"
              >
                {isNextStepPending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                    {t.proceedLoading}
                  </>
                ) : (
                  t.nextStep
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </PortalPageShell>
  );
}
