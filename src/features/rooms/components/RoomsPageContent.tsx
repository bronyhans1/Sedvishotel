"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AddRoomModal } from "@/components/rooms/AddRoomModal";
import { EditRoomModal } from "@/components/rooms/EditRoomModal";
import { RoomEmptyState } from "@/components/rooms/RoomEmptyState";
import { RoomFilters } from "@/components/rooms/RoomFilters";
import { RoomGridSkeleton } from "@/components/rooms/RoomGridSkeleton";
import { RoomTable } from "@/components/rooms/RoomTable";
import { RoomTableSkeleton } from "@/components/rooms/RoomTableSkeleton";
import { PageContainer } from "@/components/shared/PageContainer";
import { RoomsGrid } from "@/features/rooms/components/RoomsGrid";
import { RoomStatusLegend } from "@/features/rooms/components/RoomStatusLegend";
import { RoomsStats } from "@/features/rooms/components/RoomsStats";
import { filterRooms } from "@/features/rooms/lib/filter-rooms";
import type { RoomAccess } from "@/lib/auth/room-access.types";
import { siteConfig } from "@/config/site";
import type { FloorOption } from "@/types/floor";
import type { Room, RoomStats, RoomTypeOption } from "@/types/room";
import type {
  FloorFilterValue,
  RoomViewMode,
  StatusFilterValue,
} from "@/types/room";

const VIEW_LOAD_MS = 300;

type RoomsPageContentProps = {
  rooms: Room[];
  stats: RoomStats;
  access: RoomAccess;
  roomTypeOptions: RoomTypeOption[];
  floorOptions: FloorOption[];
};

export function RoomsPageContent({
  rooms,
  stats,
  access,
  roomTypeOptions,
  floorOptions,
}: RoomsPageContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [floor, setFloor] = useState<FloorFilterValue>("all");
  const [status, setStatus] = useState<StatusFilterValue>("all");
  const [viewMode, setViewMode] = useState<RoomViewMode>("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingView, setLoadingView] = useState<RoomViewMode | null>(null);

  const filteredRooms = useMemo(
    () => filterRooms(rooms, { search, floor, status }),
    [rooms, search, floor, status]
  );

  const hasActiveFilters =
    search.trim() !== "" || floor !== "all" || status !== "all";

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  function handleViewChange(mode: RoomViewMode) {
    if (mode !== viewMode) {
      setLoadingView(mode);
      setIsLoading(true);
      setViewMode(mode);
      window.setTimeout(() => {
        setIsLoading(false);
        setLoadingView(null);
      }, VIEW_LOAD_MS);
    }
  }

  function clearFilters() {
    setSearch("");
    setFloor("all");
    setStatus("all");
  }

  const showSkeleton = isLoading && loadingView !== null;
  const emptyVariant =
    rooms.length === 0
      ? "no-rooms"
      : hasActiveFilters
        ? "no-results"
        : "no-rooms";

  return (
    <PageContainer
      title="Rooms"
      description={`Manage all ${stats.total} rooms at ${siteConfig.name}.`}
      actions={
        <p className="text-xs text-muted-foreground">
          {filteredRooms.length} of {rooms.length} shown
        </p>
      }
    >
      <RoomsStats stats={stats} />

      <RoomFilters
        search={search}
        onSearchChange={setSearch}
        floor={floor}
        onFloorChange={setFloor}
        floorOptions={floorOptions}
        status={status}
        onStatusChange={setStatus}
        viewMode={viewMode}
        onViewModeChange={handleViewChange}
        onAddRoom={access.canCreate ? () => setAddOpen(true) : undefined}
        showAddButton={access.canCreate}
      />

      <RoomStatusLegend />

      {showSkeleton ? (
        viewMode === "grid" ? (
          <RoomGridSkeleton />
        ) : (
          <RoomTableSkeleton />
        )
      ) : filteredRooms.length === 0 ? (
        <RoomEmptyState variant={emptyVariant} onClearFilters={clearFilters} />
      ) : viewMode === "grid" ? (
        <RoomsGrid rooms={filteredRooms} floorOptions={floorOptions} />
      ) : (
        <RoomTable
          rooms={filteredRooms}
          canEdit={access.canEdit || access.canChangeStatus}
          onEdit={
            access.canEdit || access.canChangeStatus
              ? setEditRoom
              : undefined
          }
        />
      )}

      {access.canCreate && (
        <AddRoomModal
          open={addOpen}
          onOpenChange={setAddOpen}
          roomTypeOptions={roomTypeOptions}
          floorOptions={floorOptions}
          onSuccess={refresh}
        />
      )}
      {(access.canEdit || access.canChangeStatus) && (
        <EditRoomModal
          room={editRoom}
          open={!!editRoom}
          onOpenChange={(open) => !open && setEditRoom(null)}
          roomTypeOptions={roomTypeOptions}
          floorOptions={floorOptions}
          onSuccess={refresh}
          statusOnly={access.canChangeStatus && !access.canEdit}
        />
      )}
    </PageContainer>
  );
}
