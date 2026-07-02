"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { hasSubmittedDisputeIntake } from "@/lib/dispute-intake";
import {
  canTriggerPostIntakePipeline,
  isPostIntakePipelineComplete,
} from "@/lib/pipeline/gate";
import { tryRunPostIntakePipeline } from "@/lib/pipeline/trigger";
import { disputeIntakeSchema } from "@/lib/dispute-intake-schema";
import { getUserOnboardingStatus } from "@/lib/onboarding";

async function requireSideParticipant() {
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

  if (!userId || !role || (role !== "side1" && role !== "side2")) {
    redirect("/login");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) redirect("/login");

  return { user, role };
}

export async function submitDisputeIntake(formData: FormData) {
  const { user } = await requireSideParticipant();
  const status = await getUserOnboardingStatus(user.id);

  if (!status.canProceed || !user.onboardingCompletedAt) {
    redirect("/onboarding/tests");
  }

  if (hasSubmittedDisputeIntake(user)) {
    redirect("/mediation");
  }

  const parsed = disputeIntakeSchema.safeParse({
    disputeDescription: formData.get("disputeDescription"),
    disputePriority: formData.get("disputePriority"),
    disputeAcceptableOutcome: formData.get("disputeAcceptableOutcome"),
  });

  if (!parsed.success) {
    return;
  }

  await db
    .update(users)
    .set({
      disputeDescription: parsed.data.disputeDescription,
      disputePriority: parsed.data.disputePriority,
      disputeAcceptableOutcome: parsed.data.disputeAcceptableOutcome,
      disputeIntakeSubmittedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  if (user.roomId) {
    tryRunPostIntakePipeline(user.roomId);
  }

  revalidatePath("/dispute-intake");
  revalidatePath("/mediation");
  redirect("/mediation");
}

export async function startMediation() {
  const { user } = await requireSideParticipant();

  if (!hasSubmittedDisputeIntake(user)) {
    redirect("/dispute-intake");
  }

  const { getMediationLobbyData } = await import("@/lib/dispute-intake");
  const lobby = await getMediationLobbyData(user.id);

  if (!lobby?.bothReady) {
    redirect("/mediation");
  }

  if (!lobby.pipelineComplete) {
    redirect("/mediation");
  }

  redirect("/room");
}
