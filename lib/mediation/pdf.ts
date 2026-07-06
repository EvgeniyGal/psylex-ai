import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/portal-i18n";
import type { getMediationRoomState } from "@/lib/mediation/orchestrator";
import { generateMediationPdf } from "@/lib/mediation/generate-pdf";

type MediationState = NonNullable<Awaited<ReturnType<typeof getMediationRoomState>>>;

export async function buildAgreementDownload(state: MediationState, locale: Locale = "en") {
  const draft = state.room.draftAgreement as {
    title?: string;
    body?: string;
    terms?: string[];
  } | null;

  const copy = portalCopy[locale];
  const title = draft?.title ?? copy.mediationAgreementTitle;
  const body = draft?.body ?? copy.mediationNoAgreementOutcome;
  const terms = draft?.terms ?? [];

  const pdfBuffer = await generateMediationPdf({
    title,
    body,
    terms,
    disclaimer: copy.mediationUplDisclaimer,
    termsHeading: locale === "uk" ? "Умови" : "Terms",
  });

  return {
    filename: "mediation-results.pdf",
    mimeType: "application/pdf",
    base64: pdfBuffer.toString("base64"),
  };
}
