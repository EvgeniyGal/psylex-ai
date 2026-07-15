import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { RoomExperience } from "@/components/portal/room/room-experience";
import { fetchMediationRoomState } from "@/app/(participant)/room/actions";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { getMediationLobbyData, hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { isFlowReviewMode, requireParticipantSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RoomPageProps = {
  searchParams: Promise<{ review?: string }>;
};

export default async function RoomPage({ searchParams }: RoomPageProps) {
  const review = isFlowReviewMode((await searchParams).review);
  const { userId, role } = await requireParticipantSession();

  if (role === "mediator") {
    redirect("/mediator/rooms");
  }

  const status = await getUserOnboardingStatus(userId);

  if (!status.onboardingCompletedAt || !status.personalBotReady) {
    redirect(status.nextPath);
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login");

  if (!hasSubmittedDisputeIntake(user)) {
    redirect("/dispute-intake");
  }

  const lobby = await getMediationLobbyData(userId);
  if (!lobby?.room.mediationStartedAt) {
    redirect("/mediation");
  }

  const mediationState = await fetchMediationRoomState();

  return (
    <RoomExperience
      mediationState={mediationState}
      review={review}
      roomId={lobby.room.id}
      roomTitle={lobby.room.title}
    />
  );
}
