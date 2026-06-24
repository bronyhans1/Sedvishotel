import type { DbReservationWithRelations } from "@/types/database";

export const NO_BOOKINGS_LABEL = "No bookings yet";
export const UNKNOWN_ROOM_TYPE_LABEL = "Unknown Room Type";

type RoomTypeCount = {
  count: number;
  name: string | null;
};

/**
 * Resolves the most-booked room type to a display name (never a UUID).
 */
export function resolveMostPopularRoomTypeName(
  reservations: DbReservationWithRelations[]
): string {
  if (reservations.length === 0) {
    return NO_BOOKINGS_LABEL;
  }

  const roomTypeCounts = new Map<string, RoomTypeCount>();

  for (const reservation of reservations) {
    const typeId = reservation.room_type_id;
    if (!typeId) continue;

    const typeName = reservation.room_type?.name?.trim() || null;
    const existing = roomTypeCounts.get(typeId);

    if (existing) {
      existing.count += 1;
      if (!existing.name && typeName) {
        existing.name = typeName;
      }
    } else {
      roomTypeCounts.set(typeId, { count: 1, name: typeName });
    }
  }

  if (roomTypeCounts.size === 0) {
    return NO_BOOKINGS_LABEL;
  }

  const top = [...roomTypeCounts.values()].sort((a, b) => b.count - a.count)[0];
  if (!top) {
    return NO_BOOKINGS_LABEL;
  }

  return top.name || UNKNOWN_ROOM_TYPE_LABEL;
}
