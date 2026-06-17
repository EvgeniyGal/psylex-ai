import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sessions, users } from "@/drizzle/schema";
import { SessionDetailContent } from "@/components/admin/session-detail-content";

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  if (!session) notFound();

  const participants = await db.select().from(users).where(eq(users.sessionId, sessionId));

  return <SessionDetailContent participants={participants} session={session} />;
}
