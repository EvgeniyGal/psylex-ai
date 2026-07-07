"use client";

import { RoomMediationDetails } from "@/components/admin/room-mediation-details";
import { useLocale } from "@/components/locale-provider";
import { Modal } from "@/components/ui/modal";
import type { AdminMediationDetails } from "@/lib/mediation/admin-room-details";

export function RoomMediationDetailsModal({
  open,
  onClose,
  roomId,
  details,
}: {
  open: boolean;
  onClose: () => void;
  roomId: string;
  details: AdminMediationDetails;
}) {
  const { admin } = useLocale();

  return (
    <Modal className="!max-w-6xl" onClose={onClose} open={open} title={admin.mediationDetailsTitle}>
      <RoomMediationDetails details={details} roomId={roomId} showHeader={false} />
    </Modal>
  );
}
