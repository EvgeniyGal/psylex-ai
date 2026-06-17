import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/drizzle/schema";
import { SessionsContent } from "@/components/admin/sessions-content";

export default async function AdminSessionsPage() {
  const sessionRows = await db.select().from(sessions).orderBy(desc(sessions.createdAt));

  const participantsBySession = await Promise.all(
    sessionRows.map(async (session) => ({
      sessionId: session.id,
      users: await db.select().from(users).where(eq(users.sessionId, session.id)),
    })),
  );

  return <SessionsContent participantsBySession={participantsBySession} sessionRows={sessionRows} />;
}
