import { WelcomeScreen } from "@/components/portal/welcome-screen";
import { guardOnboardingStep, isFlowReviewMode, requireParticipantSession } from "@/lib/portal-auth";
import type { ParticipantRole } from "@/lib/participant-roles";

type WelcomePageProps = {
  searchParams: Promise<{ review?: string }>;
};

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const review = isFlowReviewMode((await searchParams).review);
  const { role } = await requireParticipantSession();

  if (!review) {
    await guardOnboardingStep("welcome");
  }

  return <WelcomeScreen review={review} role={role as ParticipantRole} />;
}
