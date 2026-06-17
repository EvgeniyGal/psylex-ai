import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformSettings } from "@/drizzle/schema";

const SETTINGS_ID = "default";

export async function getPlatformSettings() {
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, SETTINGS_ID))
    .limit(1);

  if (row) return row;

  const [created] = await db
    .insert(platformSettings)
    .values({ id: SETTINGS_ID })
    .returning();

  return created;
}
