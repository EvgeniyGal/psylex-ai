"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";
import type { LegislationContentSection } from "@/lib/mediation/legislation-summary";
import type { MediationResultsSummary } from "@/lib/mediation/results-summary";

type MediationResultsPanelProps = {
  summary: MediationResultsSummary;
};

function DocumentSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="border-l-[3px] border-law pl-4">
      <h3 className="font-display text-headline-sm text-on-surface">{heading}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function LegislationSubsection({
  section,
  excerptLabel,
  relevanceLabel,
  sourceLabel,
}: {
  section: LegislationContentSection;
  excerptLabel: string;
  relevanceLabel: string;
  sourceLabel: string;
}) {
  if (section.kind === "laws" && section.laws?.length) {
    return (
      <div className="space-y-3">
        {section.laws.map((law) => (
          <article className="rounded-lg border border-hair bg-[#F7F5F0] p-4" key={law.name}>
            <h4 className="font-display text-headline-sm text-on-surface">{law.name}</h4>
            <p className="mt-2 whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
              {law.summary}
            </p>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">{relevanceLabel}:</strong> {law.relevance}
            </p>
          </article>
        ))}
      </div>
    );
  }

  if (section.kind === "regulations" && section.regulations?.length) {
    return (
      <div className="space-y-3">
        {section.regulations.map((regulation) => (
          <article
            className="rounded-lg border border-hair bg-[#F7F5F0] p-4"
            key={regulation.name}
          >
            <h4 className="font-display text-headline-sm text-on-surface">{regulation.name}</h4>
            <p className="mt-2 whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
              {regulation.summary}
            </p>
          </article>
        ))}
      </div>
    );
  }

  if (section.kind === "citations" && section.citations?.length) {
    return (
      <div className="space-y-3">
        {section.citations.map((citation, index) => (
          <article
            className="rounded-lg border border-hair bg-[#F7F5F0] p-4"
            key={`${citation.documentName}-${index}`}
          >
            <h4 className="font-display text-headline-sm text-on-surface">{citation.documentName}</h4>
            <p className="mt-2 text-label-sm uppercase text-on-surface-variant">{excerptLabel}</p>
            <p className="mt-1 whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
              {citation.excerpt}
            </p>
            {citation.sourceUrl ? (
              <p className="mt-3 text-body-sm">
                <span className="text-on-surface-variant">{sourceLabel}: </span>
                <a
                  className="break-all text-law underline underline-offset-2 hover:text-ink"
                  href={citation.sourceUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {citation.sourceUrl}
                </a>
              </p>
            ) : null}
          </article>
        ))}
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">{section.body}</p>
  );
}

function formatDocumentDate(locale: string) {
  return new Date().toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function MediationResultsPanel({ summary }: MediationResultsPanelProps) {
  const { locale, portal: t } = useLocale();

  return (
    <article className="overflow-hidden rounded-xl border border-hair bg-paper shadow-sm">
      <div className="space-y-6 px-6 py-6 md:px-8">
        <p className="rounded-lg border border-law/50 bg-[#F7F5F0] p-4 text-body-sm leading-relaxed text-on-surface-variant">
          {t.mediationPdfTopDisclaimer}
        </p>

        <div className="space-y-1 border-b border-hair pb-5">
          <h2 className="font-display text-headline-lg text-on-surface">{summary.agreementTitle}</h2>
          <p className="text-body-sm text-on-surface-variant">{formatDocumentDate(locale)}</p>
        </div>

        <DocumentSection heading={t.mediationPdfPsychodynamicProfile}>
          <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
            {summary.psychodynamicProfile}
          </p>
        </DocumentSection>

        {summary.legislationSections.length > 0 ? (
          summary.legislationSections.map((section) => (
            <DocumentSection
              heading={`${t.mediationPdfLegislation}: ${section.heading}`}
              key={section.heading}
            >
              <LegislationSubsection
                excerptLabel={t.mediationLegislationExcerpt}
                relevanceLabel={t.mediationLegislationRelevance}
                section={section}
                sourceLabel={t.mediationLegislationSource}
              />
            </DocumentSection>
          ))
        ) : (
          <DocumentSection heading={t.mediationPdfLegislation}>
            <p className="text-body-md text-on-surface-variant">{t.mediationPdfNotAvailable}</p>
          </DocumentSection>
        )}

        <DocumentSection heading={t.mediationPdfSolution}>
          <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
            {summary.solution}
          </p>
        </DocumentSection>

        {(summary.agreementBody || summary.terms.length > 0) && (
          <div className="space-y-4 border-t border-hair pt-2">
            <h3 className="font-display text-headline-sm text-on-surface">{t.mediationAgreementTitle}</h3>
            {summary.agreementBody ? (
              <p className="whitespace-pre-wrap text-body-md leading-relaxed text-on-surface">
                {summary.agreementBody}
              </p>
            ) : null}
            {summary.terms.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-display text-headline-sm text-on-surface">{t.mediationPdfTerms}</h4>
                <ul className="list-disc space-y-1 pl-5 text-body-md text-on-surface">
                  {summary.terms.map((term) => (
                    <li key={term}>{term}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <p className="rounded-lg border border-hair bg-surface-container p-4 text-body-sm leading-relaxed text-on-surface-variant">
          {t.mediationUplDisclaimer}
        </p>
      </div>
    </article>
  );
}
