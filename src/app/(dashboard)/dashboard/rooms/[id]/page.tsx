import type { Metadata } from "next";

import { RoomDetailsContent } from "@/features/rooms/components/RoomDetailsContent";
import { loadRoomDetail } from "@/features/rooms/load-room-detail";
import { siteConfig } from "@/config/site";

type RoomDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: RoomDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const { room } = await loadRoomDetail(id);
    return {
      title: `Room ${room.roomNumber}`,
      description: `Room ${room.roomNumber} details — ${siteConfig.name}`,
    };
  } catch {
    return { title: "Room Not Found" };
  }
}

export default async function RoomDetailsPage({ params }: RoomDetailsPageProps) {
  const { id } = await params;
  const { room, access, activities, roomTypeOptions, floorOptions, displayGallery, roomPhotos } =
    await loadRoomDetail(id);
  return (
    <RoomDetailsContent
      room={room}
      access={access}
      activities={activities}
      displayGallery={displayGallery}
      roomPhotos={roomPhotos}
      roomTypeOptions={roomTypeOptions}
      floorOptions={floorOptions}
    />
  );
}
