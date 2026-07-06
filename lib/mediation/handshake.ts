import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rooms, type rooms as roomsTable } from "@/drizzle/schema";
import { getMediationLobbyData } from "@/lib/dispute-intake";
import type { PartyRole } from "@/lib/participant-roles";

export const HANDSHAKE_WINDOW_MS = 60_000;

export type HandshakeStatus = "idle" | "waiting" | "started" | "expired" | "ineligible";

export type HandshakeState = {
  status: HandshakeStatus;
  selfClicked: boolean;
  oppositeClicked: boolean;
  windowExpiresAt: Date | null;
};

export type HandshakeStatusResponse = {
  status: HandshakeStatus;
  selfClicked: boolean;
  oppositeClicked: boolean;
  windowExpiresAt: string | null;
};

type RoomHandshakeRow = Pick<
  typeof roomsTable.$inferSelect,
  | "id"
  | "partyAMediationStartClickedAt"
  | "partyBMediationStartClickedAt"
  | "mediationStartedAt"
>;

function clickForRole(room: RoomHandshakeRow, role: PartyRole) {
  return role === "party_a" ? room.partyAMediationStartClickedAt : room.partyBMediationStartClickedAt;
}

function oppositeClickForRole(room: RoomHandshakeRow, role: PartyRole) {
  return role === "party_a" ? room.partyBMediationStartClickedAt : room.partyAMediationStartClickedAt;
}

function bothClicksWithinWindow(room: RoomHandshakeRow) {
  const partyA = room.partyAMediationStartClickedAt;
  const partyB = room.partyBMediationStartClickedAt;
  if (!partyA || !partyB) return false;

  const delta = Math.abs(partyA.getTime() - partyB.getTime());
  return delta <= HANDSHAKE_WINDOW_MS;
}

function soloClickExpired(clickAt: Date, now: Date) {
  return now.getTime() - clickAt.getTime() > HANDSHAKE_WINDOW_MS;
}

export function evaluateHandshake(
  room: RoomHandshakeRow,
  viewerRole: PartyRole,
  now: Date = new Date(),
): HandshakeState {
  if (room.mediationStartedAt) {
    return {
      status: "started",
      selfClicked: true,
      oppositeClicked: true,
      windowExpiresAt: null,
    };
  }

  const selfClick = clickForRole(room, viewerRole);
  const oppositeClick = oppositeClickForRole(room, viewerRole);
  const selfClicked = !!selfClick;
  const oppositeClicked = !!oppositeClick;

  if (selfClick && oppositeClick) {
    if (bothClicksWithinWindow(room)) {
      return { status: "started", selfClicked: true, oppositeClicked: true, windowExpiresAt: null };
    }
    return { status: "expired", selfClicked, oppositeClicked, windowExpiresAt: null };
  }

  const activeClick = selfClick ?? oppositeClick;
  if (!activeClick) {
    return { status: "idle", selfClicked: false, oppositeClicked: false, windowExpiresAt: null };
  }

  const expiresAt = new Date(activeClick.getTime() + HANDSHAKE_WINDOW_MS);
  if (soloClickExpired(activeClick, now)) {
    return { status: "expired", selfClicked, oppositeClicked, windowExpiresAt: expiresAt };
  }

  return { status: "waiting", selfClicked, oppositeClicked, windowExpiresAt: expiresAt };
}

function toResponse(state: HandshakeState): HandshakeStatusResponse {
  return {
    status: state.status,
    selfClicked: state.selfClicked,
    oppositeClicked: state.oppositeClicked,
    windowExpiresAt: state.windowExpiresAt?.toISOString() ?? null,
  };
}

async function clearHandshakeClicks(roomId: string) {
  await db
    .update(rooms)
    .set({
      partyAMediationStartClickedAt: null,
      partyBMediationStartClickedAt: null,
    })
    .where(eq(rooms.id, roomId));
}

async function finalizeMediationStart(roomId: string, room: RoomHandshakeRow) {
  if (room.mediationStartedAt) return room.mediationStartedAt;

  const partyA = room.partyAMediationStartClickedAt;
  const partyB = room.partyBMediationStartClickedAt;
  if (!partyA || !partyB || !bothClicksWithinWindow(room)) return null;

  const startedAt = new Date(Math.max(partyA.getTime(), partyB.getTime()));
  await db
    .update(rooms)
    .set({ mediationStartedAt: startedAt })
    .where(eq(rooms.id, roomId));
  return startedAt;
}

async function loadRoomHandshake(roomId: string) {
  const [room] = await db
    .select({
      id: rooms.id,
      partyAMediationStartClickedAt: rooms.partyAMediationStartClickedAt,
      partyBMediationStartClickedAt: rooms.partyBMediationStartClickedAt,
      mediationStartedAt: rooms.mediationStartedAt,
    })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  return room ?? null;
}

async function resolveHandshakeState(
  roomId: string,
  room: RoomHandshakeRow,
  role: PartyRole,
  now: Date,
): Promise<HandshakeState> {
  if (room.mediationStartedAt) {
    return evaluateHandshake(room, role, now);
  }

  let state = evaluateHandshake(room, role, now);

  if (state.status === "expired") {
    await clearHandshakeClicks(roomId);
    return { status: "idle", selfClicked: false, oppositeClicked: false, windowExpiresAt: null };
  }

  if (state.status === "started") {
    await finalizeMediationStart(roomId, room);
    return state;
  }

  return state;
}

export async function recordStartClick(roomId: string, role: PartyRole): Promise<HandshakeStatusResponse> {
  const now = new Date();
  const room = await loadRoomHandshake(roomId);
  if (!room) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false, windowExpiresAt: null };
  }

  if (room.mediationStartedAt) {
    return toResponse(evaluateHandshake(room, role, now));
  }

  let current = room;
  const before = evaluateHandshake(current, role, now);
  if (before.status === "expired") {
    await clearHandshakeClicks(roomId);
    current = (await loadRoomHandshake(roomId)) ?? current;
  }

  await db
    .update(rooms)
    .set(
      role === "party_a"
        ? { partyAMediationStartClickedAt: now }
        : { partyBMediationStartClickedAt: now },
    )
    .where(eq(rooms.id, roomId));

  const updated = await loadRoomHandshake(roomId);
  if (!updated) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false, windowExpiresAt: null };
  }

  const state = await resolveHandshakeState(roomId, updated, role, now);
  return toResponse(state);
}

export async function getHandshakeStatusForUser(userId: string): Promise<HandshakeStatusResponse> {
  const lobby = await getMediationLobbyData(userId);
  if (!lobby?.canStartMediation) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false, windowExpiresAt: null };
  }

  const role = lobby.self.role;
  const now = new Date();
  const room = await loadRoomHandshake(lobby.room.id);
  if (!room) {
    return { status: "ineligible", selfClicked: false, oppositeClicked: false, windowExpiresAt: null };
  }

  const state = await resolveHandshakeState(lobby.room.id, room, role, now);
  return toResponse(state);
}
