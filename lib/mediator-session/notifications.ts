import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms } from "@/drizzle/schema";
import type { PartyNotification, PartyNotificationType } from "@/lib/mediator-session/types";
import type { PartyRole } from "@/lib/participant-roles";

export async function setPartyNotification(params: {
  roomId: string;
  type: PartyNotificationType;
  targetRole?: PartyRole | "all";
  payload?: Record<string, unknown>;
}) {
  const notification: PartyNotification = {
    id: randomUUID(),
    type: params.type,
    targetRole: params.targetRole ?? "all",
    at: new Date().toISOString(),
    payload: params.payload,
  };

  await db
    .update(rooms)
    .set({ partyNotification: notification })
    .where(eq(rooms.id, params.roomId));

  return notification;
}
