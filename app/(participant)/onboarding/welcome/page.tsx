import { WelcomeScreen } from "@/components/portal/welcome-screen";
import { guardOnboardingStep, requireParticipantSession } from "@/lib/portal-auth";
import type { ParticipantRole } from "@/lib/participant-roles";

export default async function WelcomePage() {
  await guardOnboardingStep("welcome");
  const { role } = await requireParticipantSession();

  return <WelcomeScreen role={role as ParticipantRole} />;
}
