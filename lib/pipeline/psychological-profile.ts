import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userTestCompletions, users } from "@/drizzle/schema";
import type { PsychologicalProfile } from "@/lib/pipeline/types";

export async function buildPsychologicalProfile(userId: string): Promise<PsychologicalProfile | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const completions = await db
    .select({ testKey: userTestCompletions.testKey })
    .from(userTestCompletions)
    .where(eq(userTestCompletions.userId, userId));

  return {
    userId: user.id,
    role: user.role,
    completedTests: completions.map((c) => c.testKey),
    personalBotPrompt: user.personalBotPrompt?.trim() ?? "",
  };
}

export async function buildProfilesForUsers(userIds: string[]) {
  const profiles = await Promise.all(userIds.map((id) => buildPsychologicalProfile(id)));
  return profiles.filter((p): p is PsychologicalProfile => p !== null);
}
