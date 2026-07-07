"use client";

import { useLocale } from "@/components/locale-provider";
import type { MediationPhase } from "@/lib/mediation/types";
import type { PartyRole } from "@/lib/participant-roles";
import { cn } from "@/lib/utils";

export type MediationOptionView = {
  id: string;
  description: string;
  legalNorms: string;
  fulfillmentProbability: string;
  refusalRisks: string;
};

type MediationOptionsPanelProps = {
  options: MediationOptionView[];
  viewerRole: PartyRole;
  phase: MediationPhase | null;
  selfVote: string | null;
  partyAVoteOptionId: string | null;
  partyBVoteOptionId: string | null;
  selectedOptionId: string | null;
  review?: boolean;
  canVote?: boolean;
  pending?: boolean;
  onVote?: (optionId: string) => void;
};

function optionLabel(template: string, index: number) {
  return template.replace("{n}", String(index + 1));
}

function partySelectedLabel(template: string, party: string) {
  return template.replace("{party}", party);
}

export function MediationOptionsPanel({
  options,
  viewerRole,
  phase,
  selfVote,
  partyAVoteOptionId,
  partyBVoteOptionId,
  selectedOptionId,
  review = false,
  canVote = false,
  pending = false,
  onVote,
}: MediationOptionsPanelProps) {
  const { portal: t } = useLocale();

  if (options.length === 0) return null;

  const showAllVotes =
    review ||
    phase === "voting_discrepancy" ||
    phase === "agreement" ||
    phase === "completed";

  const partyAVote = showAllVotes ? partyAVoteOptionId : viewerRole === "party_a" ? selfVote : null;
  const partyBVote = showAllVotes ? partyBVoteOptionId : viewerRole === "party_b" ? selfVote : null;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-headline-md text-on-surface">{t.mediationOptionsTitle}</h2>
      {options.map((option, index) => {
        const isSelfSelection = selfVote === option.id;
        const isPartyASelection = partyAVote === option.id;
        const isPartyBSelection = partyBVote === option.id;
        const isAgreedResolution = selectedOptionId === option.id;

        return (
          <article
            className={cn(
              "space-y-3 rounded-xl border p-4",
              isAgreedResolution
                ? "border-law bg-law-fill/20"
                : isSelfSelection
                  ? "border-law/50 bg-surface-container"
                  : "border-hair bg-paper",
            )}
            key={option.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-headline-sm text-on-surface">
                {optionLabel(t.mediationOptionLabel, index)}
              </h3>
              {isAgreedResolution ? (
                <span className="rounded-full border border-law bg-law-fill/40 px-2.5 py-0.5 text-label-sm uppercase text-on-surface">
                  {t.mediationAgreedResolution}
                </span>
              ) : null}
              {isSelfSelection && phase === "voting" ? (
                <span className="rounded-full border border-hair bg-surface-container px-2.5 py-0.5 text-label-sm uppercase text-on-surface-variant">
                  {t.mediationYourSelection}
                </span>
              ) : null}
              {showAllVotes && isPartyASelection ? (
                <span className="rounded-full border border-party-a/30 bg-party-a-fill/30 px-2.5 py-0.5 text-label-sm uppercase text-on-surface-variant">
                  {partySelectedLabel(t.mediationPartySelected, t.roles.party_a)}
                </span>
              ) : null}
              {showAllVotes && isPartyBSelection ? (
                <span className="rounded-full border border-party-b/30 bg-party-b-fill/30 px-2.5 py-0.5 text-label-sm uppercase text-on-surface-variant">
                  {partySelectedLabel(t.mediationPartySelected, t.roles.party_b)}
                </span>
              ) : null}
            </div>

            <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
              {option.description}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">{t.mediationLegalInfo}:</strong> {option.legalNorms}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">{t.mediationFulfillment}:</strong>{" "}
              {option.fulfillmentProbability}
            </p>
            <p className="text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">{t.mediationRefusalRisks}:</strong> {option.refusalRisks}
            </p>

            {canVote && !selfVote && onVote ? (
              <button
                className="btn-primary px-4 py-2 text-body-sm disabled:opacity-60"
                disabled={pending}
                onClick={() => onVote(option.id)}
                type="button"
              >
                {t.mediationSelectOption}
              </button>
            ) : null}
          </article>
        );
      })}

      {phase === "voting" && selfVote ? (
        <p className="text-body-sm text-on-surface-variant">{t.mediationVoteRecorded}</p>
      ) : null}
    </div>
  );
}

function shouldShowOptionsPanel(phase: MediationPhase | null, optionsCount: number) {
  if (optionsCount === 0) return false;
  return (
    phase === "generating_options" ||
    phase === "voting" ||
    phase === "voting_discrepancy" ||
    phase === "agreement" ||
    phase === "completed"
  );
}

export { shouldShowOptionsPanel };
