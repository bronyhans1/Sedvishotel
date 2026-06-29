import type { Metadata } from "next";
import { Suspense } from "react";

import { RoomTypesPageContent } from "@/features/room-types/components/RoomTypesPageContent";
import { RoomTypesPageSkeleton } from "@/features/room-types/components/RoomTypesPageSkeleton";
import { loadRoomTypesPageData } from "@/features/room-types/load-room-types-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Room Types",
  description: `Room type management for ${siteConfig.name}`,
};

async function RoomTypesPageLoader() {
  const { roomTypes, stats, access } = await loadRoomTypesPageData();
  return (
    <RoomTypesPageContent roomTypes={roomTypes} stats={stats} access={access} />
  );
}

export default function RoomTypesPage() {
  return (
    <Suspense fallback={<RoomTypesPageSkeleton />}>
      <RoomTypesPageLoader />
    </Suspense>
  );
}
