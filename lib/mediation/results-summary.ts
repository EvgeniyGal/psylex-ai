import { eq } from "drizzle-orm";
import type { Locale } from "@/lib/i18n";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import {
  formatLegalAnalysis,
  formatViewerPsychodynamicProfile,
} from "@/lib/mediation/format-pdf-content";
import type { getMediationRoomState } from "@/lib/mediation/orchestrator";
import { getRoomPartiesForPipeline } from "@/lib/pipeline/gate";
import type { LegalAnalysis } from "@/lib/pipeline/schemas";
import { portalCopy } from "@/lib/portal-i18n";

type MediationState = NonNullable<Awaited<ReturnType<typeof getMediationRoomState>>>;

export type MediationResultsSummary = {
  psychodynamicProfile: string;
  legislation: string;
  solution: string;
  agreementTitle: string;
  agreementBody: string | null;
  terms: string[];
};

function findSelectedOption(state: MediationState) {
  const selectedId = state.room.selectedOptionId;
  if (!selectedId) return null;

  return (
    state.options.find((option) => option.id === selectedId) ??
    (state.compromise?.id === selectedId ? state.compromise : null)
  );
}

export async function buildMediationResultsSummary(
  state: MediationState,
  locale: Locale = "en",
): Promise<MediationResultsSummary> {
  const draft = state.room.draftAgreement as {
    title?: string;
    body?: string;
    terms?: string[];
  } | null;

  const copy = portalCopy[locale];
  const selectedOption = findSelectedOption(state);

  const [{ partyA, partyB }, [room]] = await Promise.all([
    getRoomPartiesForPipeline(state.room.id),
    db.select().from(rooms).where(eq(rooms.id, state.room.id)).limit(1),
  ]);

  const psychodynamicProfile =
    partyA && partyB
      ? formatViewerPsychodynamicProfile(state.viewerRole, partyA, partyB, locale)
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

  return {
    psychodynamicProfile,
    legislation: legislationParts.join("\n\n") || copy.mediationPdfNotAvailable,
    solution: solutionParts.join("\n\n") || copy.mediationNoAgreementOutcome,
    agreementTitle: draft?.title ?? copy.mediationAgreementTitle,
    agreementBody: draft?.body ?? null,
    terms: draft?.terms ?? [],
  };
}
