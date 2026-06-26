import { redirect } from "next/navigation";
import { after } from "next/server";
import { RoomExperience } from "@/components/portal/room/room-experience";
import { getUserOnboardingStatus } from "@/lib/onboarding";
import { requireParticipantSession } from "@/lib/portal-auth";
import { ensurePipelineState } from "@/lib/room/helpers";
import { getRoomPageData } from "@/lib/room/queries";
import {
  maybeResumeStuckPipeline,
  reconcilePipelineStatus,
} from "@/lib/pipeline/orchestrator";

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
  await reconcilePipelineStatus(data.room.id);

  const roomId = data.room.id;
  after(() => {
    void maybeResumeStuckPipeline(roomId).catch(console.error);
  });

  return <RoomExperience data={data} />;
}
