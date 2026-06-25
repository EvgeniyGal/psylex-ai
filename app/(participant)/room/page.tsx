import { redirect } from "next/navigation";
import { RoomExperience } from "@/components/portal/room/room-experience";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { requireParticipantSession } from "@/lib/portal-auth";
import { ensurePipelineState } from "@/lib/room/helpers";
import { getRoomPageData } from "@/lib/room/queries";

export default async function RoomPage() {
  const { userId, role } = await requireParticipantSession();

  if (role === "mediator") {
    redirect("/mediator/rooms");
  }

  const status = await getUserOnboardingStatus(userId);

  if (!status.onboardingCompletedAt || !status.personalBotReady) {
    redirect(status.nextPath);
  }

  const data = await getRoomPageData(userId);
  if (!data) {
    redirect("/dashboard");
  }

  await ensurePipelineState(data.room.id);

  return <RoomExperience data={data} />;
}
