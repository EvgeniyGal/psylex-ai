import { DisclaimerConsentScreen } from "@/components/portal/disclaimer-consent-screen";
import { guardOnboardingStep, requireParticipantSession } from "@/lib/portal-auth";
import type { ParticipantRole } from "@/lib/participant-roles";

export default async function ConsentPage() {
  await guardOnboardingStep("consent");
  const { role } = await requireParticipantSession();

  return <DisclaimerConsentScreen role={role as ParticipantRole} />;
}
