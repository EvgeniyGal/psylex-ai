import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { isParticipantRole } from "@/lib/participant-roles";

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
    redirect("/admin/sessions");
  }

  if (!isParticipantRole(role)) {
    redirect("/login");
  }

  return { userId, role, login: session.user.name ?? "" };
}

export async function guardOnboardingStep(step: "welcome" | "consent" | "tests") {
  const { userId } = await requireParticipantSession();
  const status = await getUserOnboardingStatus(userId);

  if (status.nextStep === "complete") {
    redirect("/dashboard");
  }

  if (step === "welcome" && (status.welcomeSeenAt || status.disclaimerAcceptedAt)) {
    redirect(status.nextPath);
  }

  if (step === "consent") {
    if (status.disclaimerAcceptedAt) redirect(status.nextPath);
  }

  if (step === "tests") {
    if (!status.disclaimerAcceptedAt) redirect("/onboarding/consent");
    if (status.onboardingCompletedAt) redirect("/dashboard");
  }

  return { status };
}
