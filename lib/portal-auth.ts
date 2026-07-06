import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { getParticipantNextPath, getUserOnboardingStatus } from "@/lib/onboarding";
import { isParticipantRole, type ParticipantRole } from "@/lib/participant-roles";
import { isFlowReviewMode } from "@/lib/participant-flow";

export { isFlowReviewMode };

export async function requireParticipantSession() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  let userId = session?.user?.id;

  if (!userId && session?.user?.name) {
    const [byLogin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.login, session.user.name))
      .limit(1);
    userId = byLogin?.id;
  }

  if (!userId || !role) {
    redirect("/login");
  }

  if (role === "admin") {
    redirect("/admin/rooms");
  }

  if (!isParticipantRole(role)) {
    redirect("/login");
  }

  return { userId, role, login: session.user.name ?? "" };
}

export async function guardOnboardingStep(step: "welcome" | "consent" | "tests") {
  const { userId, role } = await requireParticipantSession();
  const status = await getUserOnboardingStatus(userId);
  const homePath = await getParticipantNextPath(userId, role as ParticipantRole);

  if (status.nextStep === "complete") {
    redirect(homePath);
  }

  if (step === "welcome" && (status.welcomeSeenAt || status.disclaimerAcceptedAt)) {
    redirect(status.nextPath);
  }

  if (step === "consent") {
    if (status.disclaimerAcceptedAt) redirect(status.nextPath);
  }

  if (step === "tests") {
    if (!status.disclaimerAcceptedAt) redirect("/onboarding/consent");
    if (status.onboardingCompletedAt) redirect(homePath);
  }

  return { status };
}
