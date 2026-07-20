export function isMediatorFacilitatedRoom(room: { createdByUserId: string | null | undefined }) {
  return !!room.createdByUserId;
}
