import { ROOM_ARCHIVED_MARKER } from "@/lib/rooms/constants";
import { normalizeRoomNumber } from "@/lib/rooms/floor-layout";
import type { DbRoom, DbRoomWithType } from "@/types/database";
import type { Room, RoomFormValues, RoomStatus } from "@/types/room";

export function isRoomArchived(row: DbRoom): boolean {
  return (row.notes ?? "").includes(ROOM_ARCHIVED_MARKER);
}

export function resolveFloorLabel(row: DbRoomWithType): string {
  return row.floor_record?.name ?? row.floor ?? "Unknown";
}

export function resolveFloorDisplayOrder(row: DbRoomWithType): number {
  return row.floor_record?.display_order ?? 0;
}

export function mapDbRoomToRoom(row: DbRoomWithType): Room {
  const roomType = row.room_type;
  return {
    id: row.room_number,
    uuid: row.id,
    roomNumber: row.room_number,
    floorId: row.floor_id,
    floorLabel: resolveFloorLabel(row),
    floorDisplayOrder: resolveFloorDisplayOrder(row),
    status: row.status as RoomStatus,
    roomTypeId: roomType.slug,
    roomTypeUuid: row.room_type_id,
    roomType: roomType.name,
    price: Number(roomType.default_price),
    capacity: roomType.capacity,
    description: roomType.description ?? "",
    notes: row.notes?.replace(ROOM_ARCHIVED_MARKER, "").trim() || undefined,
    amenities: Array.isArray(roomType.amenities) ? roomType.amenities : [],
  };
}

export function formValuesToRoomUpdate(
  values: RoomFormValues
): Partial<Pick<DbRoom, "room_number" | "floor_id" | "status" | "notes">> {
  return {
    room_number: normalizeRoomNumber(values.roomNumber),
    floor_id: values.floorId,
    status: values.status,
    notes: values.notes.trim() || null,
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
