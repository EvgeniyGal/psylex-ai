import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { users } from "@/drizzle/schema";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  if (session.user.id) return session.user.id;

  if (session.user.name) {
    const [byLogin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.login, session.user.name))
      .limit(1);
    return byLogin?.id ?? null;
  }

  return null;
}

export async function requireSessionUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
