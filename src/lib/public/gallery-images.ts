/**
 * Gallery page metadata — image paths resolved exclusively via images.ts
 */
import type { GalleryCategory, GalleryItem } from "@/types/public";
import {
  getPublicGalleryCorridorImages,
  getPublicGalleryRoomImages,
  publicImages,
} from "@/lib/public/images";

export const galleryCategories: { id: GalleryCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rooms", label: "Rooms" },
  { id: "corridors", label: "Corridors" },
];

const roomTitles = [
  "Deluxe Room Interior",
  "Standard Room Retreat",
  "Comfortable Guest Space",
];

const corridorTitles = [
  "Quiet Corridor View",
  "Elegant Guest Corridor",
  "Calm Interior Passage",
];

export const publicGalleryItems: GalleryItem[] = [
  ...getPublicGalleryRoomImages().map((src, index) => ({
    id: `rooms-${index + 1}`,
    title: roomTitles[index] ?? `Room ${index + 1}`,
    category: "rooms" as const,
    image: src,
    aspect: index % 2 === 0 ? ("wide" as const) : ("tall" as const),
  })),
  ...getPublicGalleryCorridorImages().map((src, index) => ({
    id: `corridors-${index + 1}`,
    title: corridorTitles[index] ?? `Corridor ${index + 1}`,
    category: "corridors" as const,
    image: src,
    aspect: index % 2 === 0 ? ("tall" as const) : ("wide" as const),
  })),
];

export { publicImages };
