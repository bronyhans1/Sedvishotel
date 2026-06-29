import { getPublicRoomGallery } from "@/lib/public/images";
import {
  getBedPreferencesForCategory,
  resolvePublicCategoryFromRoomType,
  resolvePublicRoomSlug,
  type PublicRoomCategoryId,
} from "@/lib/public/room-categories";
import type { DbRoomType } from "@/types/database";
import type { PublicRoom } from "@/types/public";

export const FEATURED_PUBLIC_CATEGORIES: PublicRoomCategoryId[] = [
  "standard-room",
  "deluxe-room",
];

const CATEGORY_ORDER: PublicRoomCategoryId[] = ["standard-room", "deluxe-room"];

function buildCategoryRoom(
  categoryId: PublicRoomCategoryId,
  types: DbRoomType[]
): PublicRoom {
  const sorted = [...types].sort((a, b) => a.sort_order - b.sort_order);
  const primary = sorted[0];
  const amenitiesSet = new Set<string>();

  for (const type of types) {
    for (const amenity of type.amenities ?? []) {
      amenitiesSet.add(amenity);
    }
  }

  return {
    id: categoryId,
    slug: categoryId,
    categoryId,
    name: primary.name,
    description: primary.description ?? "",
    longDescription: primary.description ?? "",
    pricePerNight: Math.min(...types.map((t) => Number(t.default_price))),
    capacity: Math.max(...types.map((t) => t.capacity)),
    amenities: Array.from(amenitiesSet),
    images: getPublicRoomGallery(categoryId),
    bedPreferences: getBedPreferencesForCategory(categoryId),
    featured: FEATURED_PUBLIC_CATEGORIES.includes(categoryId),
  };
}

/** Builds public room cards from SHMS room types — images only from marketing gallery. */
export function buildPublicRoomsFromRoomTypes(roomTypes: DbRoomType[]): PublicRoom[] {
  const byCategory = new Map<PublicRoomCategoryId, DbRoomType[]>();

  for (const type of roomTypes) {
    if (type.status !== "active") continue;
    const category = resolvePublicCategoryFromRoomType(type);
    if (!category) continue;
    const list = byCategory.get(category) ?? [];
    list.push(type);
    byCategory.set(category, list);
  }

  return CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) =>
    buildCategoryRoom(category, byCategory.get(category)!)
  );
}

export function getPublicRoomBySlug(
  rooms: PublicRoom[],
  slug: string
): PublicRoom | undefined {
  const canonical = resolvePublicRoomSlug(slug);
  return rooms.find((room) => room.slug === canonical);
}

export function getRelatedRooms(
  rooms: PublicRoom[],
  slug: string,
  limit = 3
): PublicRoom[] {
  const canonical = resolvePublicRoomSlug(slug);
  return rooms.filter((room) => room.slug !== canonical).slice(0, limit);
}

export function getFeaturedPublicRooms(rooms: PublicRoom[]): PublicRoom[] {
  return rooms.filter((room) => room.featured);
}
