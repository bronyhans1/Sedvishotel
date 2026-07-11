/**
 * Public website image paths — single source of truth.
 * Fully separate from SHMS room/room-type storage.
 *
 * Replace files under public/images/ without code changes.
 *
 * Active folders:
 *   public/images/hero/
 *   public/images/about/
 *   public/images/backgrounds/
 *   public/images/rooms/
 *   public/images/corridors/
 */

export const publicImages = {
  logo: "/logo.jpeg",
  /** Social sharing preview — place file at public/og-default.jpg */
  socialShare: "/og-default.jpg",
  hero: "/images/hero/hero-main.jpg",
  backgrounds: {
    cta: "/images/backgrounds/cta.jpg",
    pageHeader: "/images/backgrounds/page-header.jpg",
    galleryHeader: "/images/backgrounds/gallery-header.jpg",
  },
  about: {
    hero: "/images/about/about-hero.jpg",
  },
  rooms: {
    "standard-room-1": "/images/rooms/standard-room-1.jpg",
    "standard-room-2": "/images/rooms/standard-room-2.jpg",
    "standard-room-3": "/images/rooms/standard-room-3.jpg",
    "deluxe-room-1": "/images/rooms/deluxe-room-1.jpg",
    "deluxe-room-2": "/images/rooms/deluxe-room-2.jpg",
    "deluxe-room-3": "/images/rooms/deluxe-room-3.jpg",
  },
  corridors: {
    "corridor-1": "/images/corridors/corridor-1.jpg",
    "corridor-2": "/images/corridors/corridor-2.jpg",
    "corridor-3": "/images/corridors/corridor-3.jpg",
  },
} as const;

type RoomImageKey = keyof typeof publicImages.rooms;
type CorridorImageKey = keyof typeof publicImages.corridors;

/** Room detail / card galleries keyed by public marketing slug */
const roomGalleriesBySlug: Record<string, RoomImageKey[]> = {
  "standard-room": ["standard-room-1", "standard-room-2", "standard-room-3"],
  "deluxe-room": ["deluxe-room-1", "deluxe-room-2", "deluxe-room-3"],
};

/** Gallery page + homepage experience — same room photos as room pages */
export const publicGalleryRoomImageKeys: RoomImageKey[] = [
  "standard-room-1",
  "standard-room-2",
  "deluxe-room-1",
];

export const publicGalleryCorridorImageKeys: CorridorImageKey[] = [
  "corridor-1",
  "corridor-2",
  "corridor-3",
];

export function getPublicRoomImage(slug: string): string {
  return getPublicRoomGallery(slug)[0] ?? publicImages.rooms["standard-room-1"];
}

export function getPublicRoomGallery(slug: string): string[] {
  const keys = roomGalleriesBySlug[slug];
  if (keys) {
    return keys.map((key) => publicImages.rooms[key]);
  }
  return [publicImages.rooms["standard-room-1"]];
}

export function getPublicGalleryRoomImages(): string[] {
  return publicGalleryRoomImageKeys.map((key) => publicImages.rooms[key]);
}

export function getPublicGalleryCorridorImages(): string[] {
  return publicGalleryCorridorImageKeys.map((key) => publicImages.corridors[key]);
}

/** Combined images for homepage gallery experience section */
export function getPublicHomeGalleryImages(): string[] {
  return [...getPublicGalleryRoomImages(), ...getPublicGalleryCorridorImages()];
}
