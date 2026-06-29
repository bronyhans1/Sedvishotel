import type { Metadata } from "next";
import { Suspense } from "react";

import { RoomsPageContent } from "@/features/rooms/components/RoomsPageContent";
import { RoomsPageSkeleton } from "@/features/rooms/components/RoomsPageSkeleton";
import { loadRoomsPageData } from "@/features/rooms/load-rooms-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Rooms",
  description: `Room management for ${siteConfig.name}`,
};

async function RoomsPageLoader() {
  const { rooms, stats, access, roomTypeOptions, floorOptions } =
    await loadRoomsPageData();
  return (
    <RoomsPageContent
      rooms={rooms}
      stats={stats}
      access={access}
      roomTypeOptions={roomTypeOptions}
      floorOptions={floorOptions}
    />
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<RoomsPageSkeleton />}>
      <RoomsPageLoader />
    </Suspense>
  );
}
