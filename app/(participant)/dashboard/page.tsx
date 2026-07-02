import { redirect } from "next/navigation";
import { getParticipantNextPath } from "@/lib/onboarding";
import { requireParticipantSession } from "@/lib/portal-auth";
import type { ParticipantRole } from "@/lib/participant-roles";

export default async function DashboardPage() {
  const { userId, role } = await requireParticipantSession();
  redirect(await getParticipantNextPath(userId, role as ParticipantRole));
}
