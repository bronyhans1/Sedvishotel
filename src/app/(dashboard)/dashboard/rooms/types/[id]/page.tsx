import type { Metadata } from "next";

import { RoomTypeDetailsContent } from "@/features/room-types/components/RoomTypeDetailsContent";
import { loadRoomTypeDetail } from "@/features/room-types/load-room-type-detail";
import { siteConfig } from "@/config/site";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { roomType } = await loadRoomTypeDetail(id);
    return {
      title: roomType.name,
      description: `${roomType.name} — ${siteConfig.name}`,
    };
  } catch {
    return { title: "Room Type Not Found" };
  }
}

export default async function RoomTypeDetailsPage({ params }: Props) {
  const { id } = await params;
  const { roomType, access, photos } = await loadRoomTypeDetail(id);
  return <RoomTypeDetailsContent roomType={roomType} access={access} photos={photos} />;
}
