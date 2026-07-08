import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { MediationLobby } from "@/components/portal/mediation-lobby";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { getMediationLobbyData, hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { resolveMediationLobbyFlowStep } from "@/lib/participant-flow";
import { requireParticipantSession } from "@/lib/portal-auth";
import { isPartyRole } from "@/lib/participant-roles";

export const dynamic = "force-dynamic";

export default async function MediationPage() {
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

  if (!hasSubmittedDisputeIntake(user)) {
    redirect("/dispute-intake");
  }

  const lobby = await getMediationLobbyData(userId);
  if (!lobby) {
    redirect("/onboarding/tests");
  }

  if (lobby.room.mediationStartedAt) {
    redirect("/room");
  }

  const flowStep = resolveMediationLobbyFlowStep();

  return (
    <MediationLobby
      bothReady={lobby.bothReady}
      canStartMediation={lobby.canStartMediation}
      flowStep={flowStep}
      opposite={lobby.opposite}
      oppositeRole={lobby.oppositeRole}
      pipelineRunning={lobby.pipelineRunning}
      preparingMediationRoom={lobby.preparingMediationRoom}
      roomId={lobby.room.id}
      roomTitle={lobby.room.title}
      self={lobby.self}
      viewerRole={role}
    />
  );
}
