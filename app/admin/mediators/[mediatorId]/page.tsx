import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { MediatorDetailContent } from "@/components/admin/mediator-detail-content";

export default async function AdminMediatorDetailPage({
  params,
}: {
  params: Promise<{ mediatorId: string }>;
}) {
  const { mediatorId } = await params;

  const [mediator] = await db
    .select()
    .from(users)
    .where(eq(users.id, mediatorId))
    .limit(1);

  if (!mediator || mediator.role !== "mediator") notFound();

  return <MediatorDetailContent mediator={mediator} />;
}
