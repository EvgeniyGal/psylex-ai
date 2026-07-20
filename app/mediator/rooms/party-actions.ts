"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { rooms, users } from "@/drizzle/schema";
import {
  getMediatorHandshakeForParty,
  tryFinalizeMediatorSession,
} from "@/lib/mediator-session/handshake";
import {
  getMediatorSessionRoomState,
  submitMediatorPartyReply,
} from "@/lib/mediator-session/orchestrator";
import { acceptAgreement } from "@/lib/mediation/orchestrator";
import { isPartyRole } from "@/lib/participant-roles";
import type { PartyNotification } from "@/lib/mediator-session/types";

async function requirePartyUserId() {
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id;
  if (!userId && session?.user?.name) {
    const [byLogin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.login, session.user.name))
      .limit(1);
    userId = byLogin?.id;
  }
  if (!userId || !session?.user?.role || !isPartyRole(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function getMediatorPartyHandshakeAction() {
  const userId = await requirePartyUserId();
  const [user] = await db
    .select({ roomId: users.roomId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user?.roomId) return null;

  await tryFinalizeMediatorSession(user.roomId);
  const handshake = await getMediatorHandshakeForParty(userId);
  if (!handshake) return null;

  const [room] = await db
    .select({ partyNotification: rooms.partyNotification })
    .from(rooms)
    .where(eq(rooms.id, user.roomId))
    .limit(1);

  return {
    ...handshake,
    partyNotification: (room?.partyNotification as PartyNotification | null) ?? null,
  };
}

export async function fetchMediatorPartyRoomState() {
  const userId = await requirePartyUserId();
  return getMediatorSessionRoomState(userId);
}

export async function sendMediatorPartyReply(content: string) {
  const userId = await requirePartyUserId();
  return submitMediatorPartyReply(userId, content);
}

export async function submitMediatorPartyAgreement() {
  const userId = await requirePartyUserId();
  await acceptAgreement(userId);
  return getMediatorSessionRoomState(userId);
}
