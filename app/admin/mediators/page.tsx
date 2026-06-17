import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { MediatorsContent } from "@/components/admin/mediators-content";

export default async function AdminMediatorsPage() {
  const mediators = await db.select().from(users).where(eq(users.role, "mediator"));

  return <MediatorsContent mediators={mediators} />;
}
