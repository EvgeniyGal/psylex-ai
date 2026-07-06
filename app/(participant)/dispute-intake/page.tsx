import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { DisputeIntakeForm } from "@/components/portal/dispute-intake-form";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { isPartyRole } from "@/lib/participant-roles";
import { isFlowReviewMode, requireParticipantSession } from "@/lib/portal-auth";

type DisputeIntakePageProps = {
  searchParams: Promise<{ review?: string }>;
};

export default async function DisputeIntakePage({ searchParams }: DisputeIntakePageProps) {
  const review = isFlowReviewMode((await searchParams).review);
  const { userId, role } = await requireParticipantSession();

  if (!isPartyRole(role)) {
    redirect("/mediator/rooms");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login");

  if (review) {
    if (!hasSubmittedDisputeIntake(user)) {
      redirect("/dispute-intake");
    }

    return (
      <DisputeIntakeForm
        answers={{
          disputeDescription: user.disputeDescription ?? "",
          disputePriority: user.disputePriority ?? "",
          disputeAcceptableOutcome: user.disputeAcceptableOutcome ?? "",
        }}
        review
      />
    );
  }

  const status = await getUserOnboardingStatus(userId);
  if (!status.canProceed || !status.onboardingCompletedAt) {
    redirect("/onboarding/tests");
  }

  if (hasSubmittedDisputeIntake(user)) {
    redirect("/mediation");
  }

  return <DisputeIntakeForm />;
}
