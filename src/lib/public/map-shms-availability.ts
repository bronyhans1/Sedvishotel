import {
  resolvePublicCategoryFromRoomType,
  resolvePublicRoomSlug,
} from "@/lib/public/room-categories";
import { buildPublicRoomsFromRoomTypes } from "@/lib/public/public-room-catalog";
import type { DbRoomWithType } from "@/types/database";
import type { PublicRoom } from "@/types/public";

/** Maps SHMS availability results to public marketing room cards. */
export function mapShmsAvailabilityToPublicRooms(
  eligibleRooms: DbRoomWithType[],
  adults: number,
  catalog: PublicRoom[],
  roomTypeSlug?: string
): PublicRoom[] {
  const activeTypes = eligibleRooms.map((room) => room.room_type);
  const dynamicCards = buildPublicRoomsFromRoomTypes(activeTypes);

  const slugAvailability = new Map<
    string,
    { count: number; nightlyRate: number; maxCapacity: number }
  >();

  for (const room of eligibleRooms) {
    const category = resolvePublicCategoryFromRoomType(room.room_type);
    if (!category) continue;
    const current = slugAvailability.get(category) ?? {
      count: 0,
      nightlyRate: Number(room.room_type.default_price),
      maxCapacity: 0,
    };
    slugAvailability.set(category, {
      count: current.count + 1,
      nightlyRate: Math.min(current.nightlyRate, Number(room.room_type.default_price)),
      maxCapacity: Math.max(current.maxCapacity, room.room_type.capacity),
    });
  }

  const requestedCategory = roomTypeSlug
    ? String(resolvePublicRoomSlug(roomTypeSlug))
    : undefined;

  const source = dynamicCards.length > 0 ? dynamicCards : catalog;

  return source
    .filter((room) => {
      const stats = slugAvailability.get(room.slug);
      if (!stats) return false;
      if (stats.maxCapacity < adults) return false;
      if (requestedCategory && requestedCategory !== room.slug) return false;
      return true;
    })
    .map((room) => {
      const stats = slugAvailability.get(room.slug);
      return {
        ...room,
        pricePerNight: stats?.nightlyRate ?? room.pricePerNight,
      };
    });
}
