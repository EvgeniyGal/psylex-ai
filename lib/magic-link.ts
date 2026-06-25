import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { magicTokens, users } from "@/drizzle/schema";

const MAGIC_LINK_TTL_HOURS = 72;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function buildMagicLinkUrl(token: string) {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/auth/magic?token=${encodeURIComponent(token)}`;
}

export async function createMagicLinkForUser(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_HOURS * 60 * 60 * 1000);

  await db.insert(magicTokens).values({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  return buildMagicLinkUrl(rawToken);
}

export async function consumeMagicToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const [record] = await db
    .select()
    .from(magicTokens)
    .where(
      and(
        eq(magicTokens.tokenHash, tokenHash),
        isNull(magicTokens.usedAt),
        gt(magicTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!record) return null;

  const [user] = await db.select().from(users).where(eq(users.id, record.userId)).limit(1);
  if (!user) return null;

  await db
    .update(magicTokens)
    .set({ usedAt: now })
    .where(eq(magicTokens.id, record.id));

  return user;
}

export function redirectPathForRole(role: string) {
  if (role === "admin") return "/admin/rooms";
  return "/onboarding/welcome";
}
