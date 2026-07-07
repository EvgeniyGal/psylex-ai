import type { Locale } from "@/lib/i18n";
import { generateMediationPdf } from "@/lib/mediation/generate-pdf";
import { buildMediationResultsSummary } from "@/lib/mediation/results-summary";
import type { getMediationRoomState } from "@/lib/mediation/orchestrator";
import { portalCopy } from "@/lib/portal-i18n";

type MediationState = NonNullable<Awaited<ReturnType<typeof getMediationRoomState>>>;

export async function buildAgreementDownload(state: MediationState, locale: Locale = "en") {
  const copy = portalCopy[locale];
  const summary = await buildMediationResultsSummary(state, locale);

  const pdfBuffer = await generateMediationPdf({
    title: summary.agreementTitle,
    documentLabel: copy.mediationPdfDocumentTitle,
    companyName: copy.mediationPdfCompanyName,
    generatedAt: new Date(),
    sections: [
      {
        heading: copy.mediationPdfPsychodynamicProfile,
        body: summary.psychodynamicProfile,
      },
      ...summary.legislationSections.map((section) => ({
        heading: `${copy.mediationPdfLegislation}: ${section.heading}`,
        body: section.body,
      })),
      {
        heading: copy.mediationPdfSolution,
        body: summary.solution,
      },
    ],
    agreementBody: summary.agreementBody ?? undefined,
    agreementHeading: copy.mediationAgreementTitle,
    terms: summary.terms,
    topDisclaimer: copy.mediationPdfTopDisclaimer,
    disclaimer: copy.mediationUplDisclaimer,
    termsHeading: locale === "uk" ? "Умови" : "Terms",
  });

  return {
    filename: "mediation-results.pdf",
    mimeType: "application/pdf",
    base64: pdfBuffer.toString("base64"),
  };
}
