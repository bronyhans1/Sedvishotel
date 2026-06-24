import type { PublicRoom } from "@/types/public";
import { getPublicRoomGallery } from "@/lib/public/images";
import {
  getBedPreferencesForCategory,
  resolvePublicRoomSlug,
} from "@/lib/public/room-categories";

export const publicRooms: PublicRoom[] = [
  {
    id: "standard-room",
    slug: "standard-room",
    categoryId: "standard-room",
    name: "Standard Room",
    description:
      "Refined comfort with essential amenities for business and leisure travelers.",
    longDescription:
      "Our Standard Rooms offer a welcoming retreat with thoughtful design, a dedicated work area, and calming views. Enjoy complimentary high-speed Wi-Fi, climate control, and attentive 24-hour room service throughout your stay.",
    pricePerNight: 300,
    capacity: 2,
    amenities: ["Free WiFi", "Air Conditioning", "Smart TV", "Work Desk", "Room Service"],
    images: getPublicRoomGallery("standard-room"),
    bedPreferences: getBedPreferencesForCategory("standard-room"),
    featured: true,
  },
  {
    id: "deluxe-room",
    slug: "deluxe-room",
    categoryId: "deluxe-room",
    name: "Deluxe Room",
    description:
      "Upgraded accommodations with premium furnishings and enhanced comfort.",
    longDescription:
      "Deluxe Rooms elevate your stay with curated interiors, premium linens, and a refined ensuite bath. Guests enjoy priority housekeeping and complimentary bottled water for a more indulgent experience.",
    pricePerNight: 450,
    capacity: 2,
    amenities: [
      "Free WiFi",
      "Air Conditioning",
      "Smart TV",
      "Mini Bar",
      "Room Service",
      "Premium Linens",
    ],
    images: getPublicRoomGallery("deluxe-room"),
    bedPreferences: getBedPreferencesForCategory("deluxe-room"),
    featured: true,
  },
];

export function getPublicRoomBySlug(slug: string): PublicRoom | undefined {
  const canonical = resolvePublicRoomSlug(slug);
  return publicRooms.find((r) => r.slug === canonical);
}

export function getRelatedRooms(slug: string, limit = 3): PublicRoom[] {
  const room = getPublicRoomBySlug(slug);
  const canonical = room?.slug ?? slug;
  return publicRooms.filter((r) => r.slug !== canonical).slice(0, limit);
}

export const featuredPublicRooms = publicRooms.filter((r) => r.featured);
