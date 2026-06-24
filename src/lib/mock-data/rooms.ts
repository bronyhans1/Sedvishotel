import { HOTEL_FLOOR_LABELS, HOTEL_FLOOR_LAYOUT } from "@/config/hotel";
import { getRoomTypeForRoomNumber } from "@/lib/mock-data/room-types";
import { computeRoomStats } from "@/lib/occupancy";
import type { FloorId, Room, RoomActivity, RoomStatus } from "@/types/room";

export { computeRoomStats } from "@/lib/occupancy";

/** Realistic status distribution across 35 rooms */
const ROOM_STATUS_ASSIGNMENTS: RoomStatus[] = [
  "occupied",
  "available",
  "available",
  "reserved",
  "occupied",
  "cleaning",
  "available",
  "occupied",
  "occupied",
  "available",
  "reserved",
  "occupied",
  "maintenance",
  "available",
  "occupied",
  "cleaning",
  "reserved",
  "occupied",
  "available",
  "occupied",
  "reserved",
  "cleaning",
  "available",
  "occupied",
  "maintenance",
  "occupied",
  "available",
  "reserved",
  "occupied",
  "cleaning",
  "available",
  "occupied",
  "reserved",
  "available",
  "occupied",
];

function buildRoom(roomNumber: string, floor: FloorId, status: RoomStatus): Room {
  const roomType = getRoomTypeForRoomNumber(roomNumber);
  const floorOrder: Record<FloorId, number> = {
    ground: 1,
    first: 2,
    second: 3,
    third: 4,
  };
  return {
    id: roomNumber,
    uuid: `00000000-0000-4000-8000-${roomNumber.padStart(12, "0")}`,
    roomNumber,
    floorId: floor,
    floorLabel: HOTEL_FLOOR_LABELS[floor],
    floorDisplayOrder: floorOrder[floor],
    status,
    roomTypeId: roomType?.id ?? "",
    roomTypeUuid: `00000000-0000-4000-9000-${(roomType?.id ?? "unknown").slice(0, 12).padEnd(12, "0")}`,
    roomType: roomType?.name ?? "Unassigned",
    price: roomType?.defaultPrice ?? 0,
    capacity: roomType?.capacity ?? 0,
    description: roomType?.description ?? "",
    amenities: roomType?.amenities ?? [],
  };
}

function generateRooms(): Room[] {
  const rooms: Room[] = [];
  let statusIndex = 0;

  for (const [floor, numbers] of Object.entries(HOTEL_FLOOR_LAYOUT) as [
    FloorId,
    string[],
  ][]) {
    for (const roomNumber of numbers) {
      rooms.push(
        buildRoom(
          roomNumber,
          floor,
          ROOM_STATUS_ASSIGNMENTS[statusIndex] ?? "available"
        )
      );
      statusIndex += 1;
    }
  }

  return rooms;
}

export const mockRooms: Room[] = generateRooms();

export const mockRoomStats = computeRoomStats(mockRooms);

export function getRoomById(id: string): Room | undefined {
  const normalized = id.padStart(3, "0");
  return mockRooms.find(
    (r) => r.id === id || r.roomNumber === id || r.roomNumber === normalized
  );
}

export function getMockRoomActivity(roomNumber: string): RoomActivity[] {
  return [
    {
      id: "1",
      title: "Room registered",
      description: `Room ${roomNumber} added to SHMS inventory`,
      timestamp: "Jan 15, 2026 · 09:00 AM",
      type: "note",
    },
    {
      id: "2",
      title: "Status update",
      description: "Awaiting room configuration",
      timestamp: "Feb 01, 2026 · 02:30 PM",
      type: "note",
    },
    {
      id: "3",
      title: "Housekeeping scheduled",
      description: "Deep clean queued for configuration window",
      timestamp: "Mar 10, 2026 · 08:00 AM",
      type: "cleaning",
    },
  ];
}
