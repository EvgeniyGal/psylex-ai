import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { MediationLobby } from "@/components/portal/mediation-lobby";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { getMediationLobbyData, hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { requireParticipantSession } from "@/lib/portal-auth";
import type { ParticipantRole } from "@/lib/participant-roles";

export default async function MediationPage() {
  const { userId, role } = await requireParticipantSession();

  if (role !== "side1" && role !== "side2") {
    redirect("/mediator/rooms");
  }

  const status = await getUserOnboardingStatus(userId);
  if (!status.canProceed || !status.onboardingCompletedAt) {
    redirect("/onboarding/tests");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login");

  if (!hasSubmittedDisputeIntake(user)) {
    redirect("/dispute-intake");
  }

  const lobby = await getMediationLobbyData(userId);
  if (!lobby) {
    redirect("/onboarding/tests");
  }

  return (
    <MediationLobby
      bothReady={lobby.bothReady}
      opposite={lobby.opposite}
      oppositeRole={lobby.oppositeRole}
      roomTitle={lobby.room.title}
      self={lobby.self}
      viewerRole={role as ParticipantRole}
    />
  );
}
