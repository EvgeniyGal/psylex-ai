"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createMagicLinkForUser } from "@/lib/magic-link";

export async function generateMagicLinkAction(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return createMagicLinkForUser(userId);
}
