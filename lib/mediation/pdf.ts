import { eq } from "drizzle-orm";
import type { Locale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import {
  formatLegalAnalysis,
  formatPartyPsychodynamicProfiles,
} from "@/lib/mediation/format-pdf-content";
import { generateMediationPdf } from "@/lib/mediation/generate-pdf";
import type { getMediationRoomState } from "@/lib/mediation/orchestrator";
import { getRoomPartiesForPipeline } from "@/lib/pipeline/gate";
import type { LegalAnalysis } from "@/lib/pipeline/schemas";
import { portalCopy } from "@/lib/portal-i18n";

type MediationState = NonNullable<Awaited<ReturnType<typeof getMediationRoomState>>>;

function findSelectedOption(state: MediationState) {
  const selectedId = state.room.selectedOptionId;
  if (!selectedId) return null;

  return (
    state.options.find((option) => option.id === selectedId) ??
    (state.compromise?.id === selectedId ? state.compromise : null)
  );
}

export async function buildAgreementDownload(state: MediationState, locale: Locale = "en") {
  const draft = state.room.draftAgreement as {
    title?: string;
    body?: string;
    terms?: string[];
  } | null;

  const copy = portalCopy[locale];
  const title = draft?.title ?? copy.mediationAgreementTitle;
  const agreementBody = draft?.body ?? undefined;
  const terms = draft?.terms ?? [];
  const selectedOption = findSelectedOption(state);

  const [{ partyA, partyB }, [room]] = await Promise.all([
    getRoomPartiesForPipeline(state.room.id),
    db.select().from(rooms).where(eq(rooms.id, state.room.id)).limit(1),
  ]);

  const psychodynamicBody =
    partyA && partyB
      ? formatPartyPsychodynamicProfiles(partyA, partyB, locale)
      : copy.mediationPdfNotAvailable;

  const legislationParts: string[] = [];
  if (selectedOption?.legalNorms) {
    legislationParts.push(selectedOption.legalNorms);
  }
  const roomLegal = formatLegalAnalysis(room?.legalAnalysis as LegalAnalysis | null);
  if (roomLegal) {
    legislationParts.push(roomLegal);
  }

  const solutionParts: string[] = [];
  if (selectedOption) {
    solutionParts.push(selectedOption.description);
    if (selectedOption.fulfillmentProbability) {
      solutionParts.push(`${copy.mediationFulfillment}: ${selectedOption.fulfillmentProbability}`);
    }
    if (selectedOption.refusalRisks) {
      solutionParts.push(`${copy.mediationRefusalRisks}: ${selectedOption.refusalRisks}`);
    }
  }

  const pdfBuffer = await generateMediationPdf({
    title,
    sections: [
      {
        heading: copy.mediationPdfPsychodynamicProfile,
        body: psychodynamicBody,
      },
      {
        heading: copy.mediationPdfLegislation,
        body: legislationParts.join("\n\n") || copy.mediationPdfNotAvailable,
      },
      {
        heading: copy.mediationPdfSolution,
        body: solutionParts.join("\n\n") || copy.mediationNoAgreementOutcome,
      },
    ],
    agreementBody,
    agreementHeading: copy.mediationAgreementTitle,
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
