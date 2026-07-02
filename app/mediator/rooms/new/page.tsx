import { redirect } from "next/navigation";
import { RoomCreateContent } from "@/components/admin/room-create-content";
import { isRoomJurisdiction } from "@/lib/room/jurisdiction";

export default async function MediatorRoomCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ jurisdiction?: string }>;
}) {
  const { jurisdiction } = await searchParams;
  if (!jurisdiction || !isRoomJurisdiction(jurisdiction)) {
    redirect("/mediator/rooms");
  }

  return <RoomCreateContent basePath="/mediator/rooms" jurisdiction={jurisdiction} />;
}
