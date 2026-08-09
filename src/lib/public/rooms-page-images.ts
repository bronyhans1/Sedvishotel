/**
 * Public /rooms catalogue gallery presentation.
 * Same room category can expose multiple photograph sets for marketing cards.
 * Booking slug stays unchanged — only gallery selection differs.
 */

import { getPublicRoomGallery, publicImages } from "@/lib/public/images";

/** Catalogue gallery variants selectable via ?gallery= on room detail. */
export type RoomsPageGalleryId = "primary" | "alternate";

export const ROOMS_PAGE_GALLERY_PRIMARY: RoomsPageGalleryId = "primary";
export const ROOMS_PAGE_GALLERY_ALTERNATE: RoomsPageGalleryId = "alternate";

/** Query param used on /rooms/[slug] to select a catalogue gallery set. */
export const ROOMS_PAGE_GALLERY_QUERY = "gallery";

/**
 * Per-slug catalogue galleries.
 * `primary` matches the default room catalog images.
 * `alternate` is used only for the second Standard marketing card.
 */
const roomsPageGalleriesBySlug: Record<
  string,
  Partial<Record<RoomsPageGalleryId, readonly string[]>>
> = {
  "standard-room": {
    primary: getPublicRoomGallery("standard-room"),
    alternate: [
      publicImages.rooms["standard-room-4"],
      publicImages.rooms["standard-room-5"],
      publicImages.rooms["standard-room-6"],
    ],
  },
  "deluxe-room": {
    primary: getPublicRoomGallery("deluxe-room"),
  },
};

export function isRoomsPageGalleryId(value: string): value is RoomsPageGalleryId {
  return value === "primary" || value === "alternate";
}

/** Resolve gallery images for a catalogue card / detail selection. */
export function getRoomsPageGallery(
  roomSlug: string,
  galleryId: RoomsPageGalleryId = ROOMS_PAGE_GALLERY_PRIMARY
): string[] {
  const bySlug = roomsPageGalleriesBySlug[roomSlug];
  const selected = bySlug?.[galleryId] ?? bySlug?.[ROOMS_PAGE_GALLERY_PRIMARY];
  if (selected?.length) {
    return [...selected];
  }
  return getPublicRoomGallery(roomSlug);
}

/** Cover frame for a catalogue gallery. */
export function getRoomsPageGalleryCover(
  roomSlug: string,
  galleryId: RoomsPageGalleryId = ROOMS_PAGE_GALLERY_PRIMARY
): string {
  return (
    getRoomsPageGallery(roomSlug, galleryId)[0] ??
    publicImages.rooms["standard-room-1"]
  );
}

/** View Details href preserving booking slug and attaching gallery selection. */
export function getRoomsPageDetailsHref(
  roomSlug: string,
  galleryId: RoomsPageGalleryId = ROOMS_PAGE_GALLERY_PRIMARY
): string {
  if (galleryId === ROOMS_PAGE_GALLERY_PRIMARY) {
    return `/rooms/${roomSlug}`;
  }
  return `/rooms/${roomSlug}?${ROOMS_PAGE_GALLERY_QUERY}=${galleryId}`;
}

/** Parse detail-page gallery query; unknown values fall back to primary. */
export function parseRoomsPageGalleryId(
  value: string | string[] | undefined
): RoomsPageGalleryId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && isRoomsPageGalleryId(raw)) {
    return raw;
  }
  return ROOMS_PAGE_GALLERY_PRIMARY;
}
