"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { nextReviewStepPath, type ParticipantFlowStepId } from "@/lib/participant-flow";

type FlowReviewNextProps = {
  step: ParticipantFlowStepId;
  href?: string;
};

export function FlowReviewNext({ step, href }: FlowReviewNextProps) {
  const { portal: t } = useLocale();
  const target = href ?? nextReviewStepPath(step);

  if (!target) return null;

  return (
    <div className="flex justify-center pt-4">
      <Link className="btn-primary inline-flex items-center gap-2 px-8 py-4" href={target}>
        {t.flowReviewNext}
        <span className="font-display italic text-law-mark">→</span>
      </Link>
    </div>
  );
}
