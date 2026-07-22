"use client";

import { useLocale } from "@/components/locale-provider";
import type { MediationOptionView } from "@/components/portal/room/mediation-options-panel";
import { cn } from "@/lib/utils";

type MediationVotesDiscrepancyNoticeProps = {
  options: MediationOptionView[];
  partyAVoteOptionId: string | null;
  partyBVoteOptionId: string | null;
  /** True while compromise is still being created / awaiting publish. */
  pending?: boolean;
  className?: string;
};

function optionLabel(template: string, index: number) {
  return template.replace("{n}", String(index + 1));
}

function resolveOptionLabel(
  options: MediationOptionView[],
  optionId: string | null,
  labelTemplate: string,
) {
  if (!optionId) return "—";
  const index = options.findIndex((option) => option.id === optionId);
  return index >= 0 ? optionLabel(labelTemplate, index) : optionId;
}

export function MediationVotesDiscrepancyNotice({
  options,
  partyAVoteOptionId,
  partyBVoteOptionId,
  pending = false,
  className,
}: MediationVotesDiscrepancyNoticeProps) {
  const { portal: t } = useLocale();

  return (
    <div className={cn("rounded-xl border border-med-line bg-med-fill/25 p-4", className)}>
      <p className="text-body-sm text-on-surface-variant">
        {pending ? t.mediationVotesDiscrepancyPending : t.mediationVotesDiscrepancy}
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-body-sm text-on-surface">
        <span className="rounded-full border border-party-a/30 bg-party-a-fill/40 px-2.5 py-1">
          {t.roles.party_a}: {resolveOptionLabel(options, partyAVoteOptionId, t.mediationOptionLabel)}
        </span>
        <span className="rounded-full border border-party-b/30 bg-party-b-fill/40 px-2.5 py-1">
          {t.roles.party_b}: {resolveOptionLabel(options, partyBVoteOptionId, t.mediationOptionLabel)}
        </span>
      </div>
    </div>
  );
}
