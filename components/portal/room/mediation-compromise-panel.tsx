"use client";

import { useLocale } from "@/components/locale-provider";
import type { MediationOptionView } from "@/components/portal/room/mediation-options-panel";
import type { MediationPhase } from "@/lib/mediation/types";
import { cn } from "@/lib/utils";

type MediationCompromisePanelProps = {
  compromise: MediationOptionView;
  options: MediationOptionView[];
  partyAVoteOptionId: string | null;
  partyBVoteOptionId: string | null;
  partyACompromiseVote?: boolean | null;
  partyBCompromiseVote?: boolean | null;
  phase: MediationPhase | null;
  selfCompromiseVote: boolean | null;
  selectedOptionId?: string | null;
  review?: boolean;
  pending?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
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

function compromiseVoteLabel(
  vote: boolean | null | undefined,
  accepted: string,
  rejected: string,
  noVote: string,
) {
  if (vote === null || vote === undefined) return noVote;
  return vote ? accepted : rejected;
}

export function MediationCompromisePanel({
  compromise,
  options,
  partyAVoteOptionId,
  partyBVoteOptionId,
  partyACompromiseVote = null,
  partyBCompromiseVote = null,
  phase,
  selfCompromiseVote,
  selectedOptionId = null,
  review = false,
  pending = false,
  onAccept,
  onReject,
}: MediationCompromisePanelProps) {
  const { portal: t } = useLocale();

  const isAgreedResolution = selectedOptionId === compromise.id;
  const canVote =
    !review && phase === "voting_discrepancy" && selfCompromiseVote === null && onAccept && onReject;
  const showCompromiseVotes =
    review || phase === "agreement" || phase === "completed" || selfCompromiseVote !== null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-med-line bg-med-fill/25 p-4">
        <p className="text-body-sm text-on-surface-variant">{t.mediationVotesDiscrepancy}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-body-sm text-on-surface">
          <span className="rounded-full border border-party-a/30 bg-party-a-fill/40 px-2.5 py-1">
            {t.roles.party_a}: {resolveOptionLabel(options, partyAVoteOptionId, t.mediationOptionLabel)}
          </span>
          <span className="rounded-full border border-party-b/30 bg-party-b-fill/40 px-2.5 py-1">
            {t.roles.party_b}: {resolveOptionLabel(options, partyBVoteOptionId, t.mediationOptionLabel)}
          </span>
        </div>
      </div>

      <article
        className={cn(
          "space-y-3 rounded-xl border p-4",
          isAgreedResolution ? "border-law bg-law-fill/20" : "border-med-line bg-paper",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-headline-md text-on-surface">{t.mediationCompromiseTitle}</h2>
          {isAgreedResolution ? (
            <span className="rounded-full border border-law bg-law-fill/40 px-2.5 py-0.5 text-label-sm uppercase text-on-surface">
              {t.mediationAgreedResolution}
            </span>
          ) : null}
        </div>

        <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
          {compromise.description}
        </p>
        <p className="text-body-sm text-on-surface-variant">
          <strong className="text-on-surface">{t.mediationLegalInfo}:</strong> {compromise.legalNorms}
        </p>
        <p className="text-body-sm text-on-surface-variant">
          <strong className="text-on-surface">{t.mediationFulfillment}:</strong>{" "}
          {compromise.fulfillmentProbability}
        </p>
        <p className="text-body-sm text-on-surface-variant">
          <strong className="text-on-surface">{t.mediationRefusalRisks}:</strong> {compromise.refusalRisks}
        </p>

        {canVote ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              className="btn-primary px-4 py-2 text-body-sm disabled:opacity-60"
              disabled={pending}
              onClick={onAccept}
              type="button"
            >
              {t.mediationAcceptCompromise}
            </button>
            <button
              className="btn-secondary px-4 py-2 text-body-sm disabled:opacity-60"
              disabled={pending}
              onClick={onReject}
              type="button"
            >
              {t.mediationRejectCompromise}
            </button>
          </div>
        ) : null}

        {!canVote && selfCompromiseVote !== null && phase === "voting_discrepancy" ? (
          <p className="text-body-sm text-on-surface-variant">{t.mediationCompromiseVoteRecorded}</p>
        ) : null}

        {showCompromiseVotes ? (
          <div className="grid gap-3 border-t border-hair pt-3 sm:grid-cols-2">
            <p className="text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">{t.roles.party_a}:</strong>{" "}
              {compromiseVoteLabel(
                partyACompromiseVote,
                t.mediationCompromiseAccepted,
                t.mediationCompromiseRejected,
                t.mediationCompromiseNoVote,
              )}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">{t.roles.party_b}:</strong>{" "}
              {compromiseVoteLabel(
                partyBCompromiseVote,
                t.mediationCompromiseAccepted,
                t.mediationCompromiseRejected,
                t.mediationCompromiseNoVote,
              )}
            </p>
          </div>
        ) : null}
      </article>
    </div>
  );
}
