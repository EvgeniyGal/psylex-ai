"use client";

import { useLocale } from "@/components/locale-provider";
import type { MediationResultsSummary } from "@/lib/mediation/results-summary";

type MediationResultsPanelProps = {
  summary: MediationResultsSummary;
};

function ResultSection({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="glass-panel space-y-2 rounded-xl p-4">
      <h2 className="font-display text-headline-md text-on-surface">{heading}</h2>
      <p className="whitespace-pre-wrap text-body-md text-on-surface">{body}</p>
    </section>
  );
}

export function MediationResultsPanel({ summary }: MediationResultsPanelProps) {
  const { portal: t } = useLocale();

  return (
    <div className="space-y-4">
      <ResultSection body={summary.psychodynamicProfile} heading={t.mediationPdfPsychodynamicProfile} />
      <ResultSection body={summary.legislation} heading={t.mediationPdfLegislation} />
      <ResultSection body={summary.solution} heading={t.mediationPdfSolution} />

      <section className="glass-panel space-y-3 rounded-xl p-4">
        <h2 className="font-display text-headline-md text-on-surface">{summary.agreementTitle}</h2>
        {summary.agreementBody ? (
          <p className="whitespace-pre-wrap text-body-md text-on-surface">{summary.agreementBody}</p>
        ) : null}
        {summary.terms.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-body-md text-on-surface">
            {summary.terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        ) : null}
        <p className="rounded-lg border border-hair bg-surface-container p-3 text-body-sm text-on-surface-variant">
          {t.mediationUplDisclaimer}
        </p>
      </section>
    </div>
  );
}
