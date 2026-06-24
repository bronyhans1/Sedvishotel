import type { Floor } from "@/types/floor";
import type { Room, RoomStats, RoomStatus } from "@/types/room";

export type OccupancyMetrics = RoomStats & {
  occupancyRate: number;
};

const STATUS_KEYS: RoomStatus[] = [
  "available",
  "occupied",
  "reserved",
  "cleaning",
  "maintenance",
];

/** Count rooms by status from live inventory */
export function computeRoomStats(rooms: Room[]): RoomStats {
  const stats: RoomStats = {
    total: rooms.length,
    available: 0,
    occupied: 0,
    reserved: 0,
    cleaning: 0,
    maintenance: 0,
  };

  for (const room of rooms) {
    stats[room.status] += 1;
  }

  return stats;
}

/** Occupancy % = (occupied / total) × 100 using actual room data */
export function computeOccupancyRate(rooms: Room[]): number {
  const stats = computeRoomStats(rooms);
  if (stats.total === 0) return 0;
  return Math.round((stats.occupied / stats.total) * 100);
}

/**
 * Full occupancy snapshot from room status data.
 */
export function computeOccupancyFromRooms(rooms: Room[]): OccupancyMetrics {
  const stats = computeRoomStats(rooms);
  const statusSum = STATUS_KEYS.reduce((sum, key) => sum + stats[key], 0);

  if (statusSum !== stats.total && process.env.NODE_ENV === "development") {
    console.warn(
      `[SHMS] Room status sum (${statusSum}) does not match inventory (${stats.total})`
    );
  }

  return {
    ...stats,
    total: stats.total,
    occupancyRate: computeOccupancyRate(rooms),
  };
}

export type FloorOccupancyBreakdown = {
  floor: string;
  floorId: string;
  displayOrder: number;
  occupied: number;
  total: number;
};

export function deriveFloorsFromRooms(rooms: Room[]): Floor[] {
  const map = new Map<string, Floor>();
  for (const room of rooms) {
    if (!map.has(room.floorId)) {
      map.set(room.floorId, {
        id: room.floorId,
        name: room.floorLabel,
        displayOrder: room.floorDisplayOrder,
        description: "",
        active: true,
        roomCount: 0,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function computeFloorBreakdown(
  rooms: Room[],
  floors?: Floor[]
): FloorOccupancyBreakdown[] {
  const floorList = floors ?? deriveFloorsFromRooms(rooms);
  const sorted = [...floorList].sort((a, b) => a.displayOrder - b.displayOrder);
  return sorted.map((floor) => {
    const floorRooms = rooms.filter((room) => room.floorId === floor.id);
    return {
      floorId: floor.id,
      floor: floor.name,
      displayOrder: floor.displayOrder,
      occupied: floorRooms.filter((room) => room.status === "occupied").length,
      total: floorRooms.length,
    };
  });
}
