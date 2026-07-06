import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { DisputeIntakeForm } from "@/components/portal/dispute-intake-form";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { isPartyRole } from "@/lib/participant-roles";
import { requireParticipantSession } from "@/lib/portal-auth";

export default async function DisputeIntakePage() {
  const { userId, role } = await requireParticipantSession();

  if (!isPartyRole(role)) {
    redirect("/mediator/rooms");
  }

  const status = await getUserOnboardingStatus(userId);
  if (!status.canProceed || !status.onboardingCompletedAt) {
    redirect("/onboarding/tests");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login");

  if (hasSubmittedDisputeIntake(user)) {
    redirect("/mediation");
  }

  return <DisputeIntakeForm />;
}
