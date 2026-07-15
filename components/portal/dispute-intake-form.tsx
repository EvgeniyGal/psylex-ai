"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { submitDisputeIntake } from "@/app/dispute-intake/actions";
import { FlowReviewNext } from "@/components/portal/flow-review-next";
import { PortalPageShell } from "@/components/portal/portal-page-shell";
import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/components/locale-provider";

const textareaClass =
  "w-full rounded-md border border-outline-variant/40 bg-surface-container px-4 py-3 font-sans text-body-md text-on-surface shadow-sm outline-none transition-colors placeholder:text-on-surface-variant focus:border-law focus:bg-paper focus:ring-2 focus:ring-law/20";

const readOnlyFieldClass =
  "w-full rounded-md border border-outline-variant/40 bg-surface-container px-4 py-3 font-sans text-body-md text-on-surface shadow-sm";

function SubmitButton({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn-primary flex w-full items-center justify-center gap-2 px-8 py-4 font-display text-label-md disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <Spinner size="sm" className="text-white" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

type DisputeAnswers = {
  disputeDescription: string;
  disputePriority: string;
  disputeAcceptableOutcome: string;
};

type DisputeIntakeFormProps = {
  review?: boolean;
  answers?: DisputeAnswers;
};

export function DisputeIntakeForm({ review = false, answers }: DisputeIntakeFormProps) {
  const { portal: t } = useLocale();

  return (
    <PortalPageShell flowStep={3}>
      <main className="mx-auto flex w-full max-w-2xl flex-grow flex-col px-margin-mobile py-stack-lg md:px-margin-desktop">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-display-lg text-on-surface">{t.disputeIntakeTitle}</h1>
          <p className="font-sans text-body-lg text-on-surface-variant">{t.disputeIntakeSubtitle}</p>
        </div>

        {review && answers ? (
          <div className="flex flex-col gap-stack-md">
            <div className="flex flex-col gap-2">
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ1}</span>
              <p className={`${readOnlyFieldClass} min-h-32 whitespace-pre-wrap`}>{answers.disputeDescription}</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ2}</span>
              <p className={`${readOnlyFieldClass} min-h-24 whitespace-pre-wrap`}>{answers.disputePriority}</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ3}</span>
              <p className={`${readOnlyFieldClass} min-h-24 whitespace-pre-wrap`}>{answers.disputeAcceptableOutcome}</p>
            </div>
            <FlowReviewNext step={3} />
            <p className="text-center">
              <Link className="text-body-sm text-on-surface-variant underline" href="/room">
                {t.flowReviewBackToCurrent}
              </Link>
            </p>
          </div>
        ) : (
          <form action={submitDisputeIntake} className="flex flex-col gap-stack-md">
            <label className="flex flex-col gap-2">
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ1}</span>
              <textarea
                className={`${textareaClass} min-h-32`}
                name="disputeDescription"
                required
                rows={5}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ2}</span>
              <textarea
                className={`${textareaClass} min-h-24`}
                name="disputePriority"
                required
                rows={4}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-display text-headline-md text-on-surface">{t.disputeIntakeQ3}</span>
              <textarea
                className={`${textareaClass} min-h-24`}
                name="disputeAcceptableOutcome"
                required
                rows={4}
              />
            </label>

            <div className="mt-4 flex justify-center">
              <SubmitButton label={t.disputeIntakeSubmit} loadingLabel={t.disputeIntakeSubmitting} />
            </div>
          </form>
        )}
      </main>
    </PortalPageShell>
  );
}
