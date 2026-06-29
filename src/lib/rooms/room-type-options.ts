import { formatCurrency } from "@/lib/utils";
import type { Room, RoomTypeOption } from "@/types/room";
import type { RoomType } from "@/types/room-type";

export function deriveRoomTypeOptionsFromRooms(rooms: Room[]): RoomTypeOption[] {
  const byId = new Map<string, RoomTypeOption>();
  for (const room of rooms) {
    if (!room.roomTypeId || byId.has(room.roomTypeId)) continue;
    byId.set(room.roomTypeId, {
      id: room.roomTypeId,
      name: room.roomType,
      capacity: room.capacity,
      defaultPrice: room.price,
    });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function mapRoomTypesToOptions(
  roomTypes: RoomType[],
  ensureTypeIds: string[] = []
): RoomTypeOption[] {
  const ensure = new Set(ensureTypeIds.filter(Boolean));
  return roomTypes
    .filter((type) => type.status === "active" || ensure.has(type.id))
    .map((type) => ({
      id: type.id,
      name: type.name,
      capacity: type.capacity,
      defaultPrice: type.defaultPrice,
    }));
}

export function formatRoomTypeOptionLabel(option: RoomTypeOption): string {
  const parts = [
    option.name,
    `${option.capacity} guest${option.capacity === 1 ? "" : "s"}`,
  ];
  if (option.defaultPrice > 0) {
    parts.push(formatCurrency(option.defaultPrice));
  }
  return parts.join(" · ");
}
