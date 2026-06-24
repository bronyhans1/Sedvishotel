import { normalizeRoomNumber } from "@/lib/rooms/floor-layout";
import type {
  FloorFilterValue,
  Room,
  StatusFilterValue,
} from "@/types/room";

export type RoomFilterParams = {
  search: string;
  floor: FloorFilterValue;
  status: StatusFilterValue;
};

export function filterRooms(rooms: Room[], params: RoomFilterParams): Room[] {
  const search = params.search.trim().toLowerCase();

  return rooms.filter((room) => {
    if (params.floor !== "all" && room.floorId !== params.floor) {
      return false;
    }

    if (params.status !== "all" && room.status !== params.status) {
      return false;
    }

    if (search) {
      const roomNum = room.roomNumber.toLowerCase();
      const normalizedSearch = normalizeRoomNumber(search).toLowerCase();
      const normalizedRoom = normalizeRoomNumber(room.roomNumber).toLowerCase();
      return (
        roomNum.includes(search) ||
        normalizedRoom.includes(normalizedSearch) ||
        normalizedRoom === normalizedSearch
      );
    }

    return true;
  });
}
