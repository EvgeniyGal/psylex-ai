import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { ParticipantFlowProgressProvider } from "@/components/portal/participant-flow-progress-provider";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { getParticipantFlowProgressForUser } from "@/lib/participant-flow-progress";
import type { ParticipantFlowStepId } from "@/lib/participant-flow";
import { isPartyRole } from "@/lib/participant-roles";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

async function resolveMaxReachedStep(): Promise<ParticipantFlowStepId> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !isPartyRole(session.user.role)) {
    return 0;
  }

  let userId = session.user.id;
  if (!userId && session.user.name) {
    const [byLogin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.login, session.user.name))
      .limit(1);
    userId = byLogin?.id;
  }

  if (!userId) return 0;

  return getParticipantFlowProgressForUser(userId);
}

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const maxReachedStep = await resolveMaxReachedStep();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <ParticipantFlowProgressProvider maxReachedStep={maxReachedStep}>
        {children}
      </ParticipantFlowProgressProvider>
    </div>
  );
}
