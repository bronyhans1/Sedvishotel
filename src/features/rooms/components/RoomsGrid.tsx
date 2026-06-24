"use client";

import { RoomCard } from "@/components/rooms/RoomCard";
import type { FloorOption } from "@/types/floor";
import type { Room } from "@/types/room";

type RoomsGridProps = {
  rooms: Room[];
  floorOptions: FloorOption[];
  groupByFloor?: boolean;
};

export function RoomsGrid({
  rooms,
  floorOptions,
  groupByFloor = true,
}: RoomsGridProps) {
  if (!groupByFloor) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    );
  }

  const sortedFloors = [...floorOptions].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const byFloor = sortedFloors
    .map((floor) => ({
      floor,
      rooms: rooms.filter((r) => r.floorId === floor.id),
    }))
    .filter((g) => g.rooms.length > 0);

  return (
    <div className="space-y-8">
      {byFloor.map(({ floor, rooms: floorRooms }) => (
        <section key={floor.id}>
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {floor.name}
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {floorRooms.length} rooms
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {floorRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
