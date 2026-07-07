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
      <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">{body}</p>
    </section>
  );
}

export function MediationResultsPanel({ summary }: MediationResultsPanelProps) {
  const { portal: t } = useLocale();

  return (
    <div className="space-y-4">
      <ResultSection body={summary.psychodynamicProfile} heading={t.mediationPdfPsychodynamicProfile} />

      <section className="glass-panel space-y-4 rounded-xl p-4">
        <h2 className="font-display text-headline-md text-on-surface">{t.mediationPdfLegislation}</h2>
        {summary.legislationSections.length > 0 ? (
          summary.legislationSections.map((section) => (
            <div className="space-y-2 border-t border-hair pt-4 first:border-t-0 first:pt-0" key={section.heading}>
              <h3 className="font-display text-headline-sm text-on-surface">{section.heading}</h3>
              <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">{section.body}</p>
            </div>
          ))
        ) : (
          <p className="text-body-md text-on-surface-variant">{t.mediationPdfNotAvailable}</p>
        )}
      </section>

      <ResultSection body={summary.solution} heading={t.mediationPdfSolution} />

      <section className="glass-panel space-y-3 rounded-xl p-4">
        <h2 className="font-display text-headline-md text-on-surface">{summary.agreementTitle}</h2>
        {summary.agreementBody ? (
          <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">{summary.agreementBody}</p>
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
