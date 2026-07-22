import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { MediatorLayoutClient } from "@/components/mediator/mediator-layout-client";
import { users } from "@/drizzle/schema";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserOnboardingStatus } from "@/lib/onboarding";

export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function MediatorLayout({ children }: { children: React.ReactNode }) {
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

  if (!session || role !== "mediator" || !userId) {
    redirect("/login");
  }

  const status = await getUserOnboardingStatus(userId);
  if (!status.onboardingCompletedAt) {
    redirect(status.nextPath);
  }

  return <MediatorLayoutClient>{children}</MediatorLayoutClient>;
}
