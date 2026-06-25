import { DashboardComplete } from "@/components/portal/dashboard-complete";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { requireParticipantSession } from "@/lib/portal-auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId, role } = await requireParticipantSession();

  if (role === "mediator") {
    redirect("/mediator/rooms");
  }

  const status = await getUserOnboardingStatus(userId);

  if (!status.onboardingCompletedAt) {
    redirect(status.nextPath);
  }

  return <DashboardComplete />;
}
