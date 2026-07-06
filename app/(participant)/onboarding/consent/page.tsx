import { DisclaimerConsentScreen } from "@/components/portal/disclaimer-consent-screen";
import { guardOnboardingStep, isFlowReviewMode, requireParticipantSession } from "@/lib/portal-auth";
import type { ParticipantRole } from "@/lib/participant-roles";

type ConsentPageProps = {
  searchParams: Promise<{ review?: string }>;
};

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const review = isFlowReviewMode((await searchParams).review);
  const { role } = await requireParticipantSession();

  if (!review) {
    await guardOnboardingStep("consent");
  }

  return <DisclaimerConsentScreen review={review} role={role as ParticipantRole} />;
}
