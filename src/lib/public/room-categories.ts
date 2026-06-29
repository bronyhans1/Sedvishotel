/**
 * Public marketing categories — decoupled from SHMS operational room types.
 * Only categories that currently exist are exposed on the public website.
 */

export const PUBLIC_BED_PREFERENCES = [
  { id: "double", label: "Double Bed" },
  { id: "queen", label: "Queen Bed" },
  { id: "none", label: "No Preference (Recommended)" },
] as const;

export type PublicBedPreferenceId = (typeof PUBLIC_BED_PREFERENCES)[number]["id"];

/** Active public marketing categories */
export type PublicRoomCategoryId = "standard-room" | "deluxe-room";

/** Reserved for future expansion without changing SHMS inventory */
export type FuturePublicRoomCategoryId =
  | "executive-room"
  | "family-suite"
  | "presidential-suite"
  | "executive-suite"
  | "junior-suite"
  | "family-apartment";

/** Maps SHMS / internal room type names to public marketing categories. */
export const internalToPublicCategoryMap: Record<string, PublicRoomCategoryId> = {
  "Standard Single": "standard-room",
  "Standard Double": "standard-room",
  "Standard Queen": "standard-room",
  "Deluxe Double": "deluxe-room",
  "Deluxe Queen": "deluxe-room",
  "Deluxe Room": "deluxe-room",
};

/** Legacy public slugs redirected to current marketing categories. */
export const publicRoomSlugAliases: Record<string, PublicRoomCategoryId> = {
  "standard-single": "standard-room",
  "standard-double": "standard-room",
  "standard-queen": "standard-room",
  deluxe: "deluxe-room",
  "deluxe-double": "deluxe-room",
  "deluxe-queen": "deluxe-room",
  executive: "deluxe-room",
  "executive-room": "deluxe-room",
  "family-suite": "deluxe-room",
};

/** SHMS operational room type slugs → public marketing category. */
export const operationalSlugToPublicCategory: Record<string, PublicRoomCategoryId> = {
  ...publicRoomSlugAliases,
  "standard-room": "standard-room",
  "deluxe-room": "deluxe-room",
};

const defaultBedPreferences: Record<PublicRoomCategoryId, PublicBedPreferenceId[]> = {
  "standard-room": ["double", "queen", "none"],
  "deluxe-room": ["queen", "none"],
};

export function mapInternalRoomTypeToPublicCategory(
  internalName: string
): PublicRoomCategoryId | null {
  return internalToPublicCategoryMap[internalName] ?? null;
}

export function resolvePublicRoomSlug(slug: string): PublicRoomCategoryId | string {
  const normalized = slug.trim().toLowerCase();
  return (
    publicRoomSlugAliases[normalized] ??
    (normalized === "standard-room" || normalized === "deluxe-room"
      ? normalized
      : normalized)
  );
}

/** Maps an SHMS room type to a public marketing category (slug or name). */
export function resolvePublicCategoryFromRoomType(roomType: {
  slug: string;
  name: string;
}): PublicRoomCategoryId | null {
  const slugKey = roomType.slug.trim().toLowerCase();
  if (operationalSlugToPublicCategory[slugKey]) {
    return operationalSlugToPublicCategory[slugKey];
  }

  const aliased = resolvePublicRoomSlug(slugKey);
  if (
    aliased === "standard-room" ||
    aliased === "deluxe-room"
  ) {
    return aliased;
  }

  return mapInternalRoomTypeToPublicCategory(roomType.name);
}

export function roomTypeMatchesPublicCategory(
  roomType: { slug: string; name: string },
  publicCategorySlug: string
): boolean {
  const category = resolvePublicCategoryFromRoomType(roomType);
  if (!category) return false;
  const requested = resolvePublicRoomSlug(publicCategorySlug);
  return category === requested;
}

export function getBedPreferencesForCategory(
  categoryId: PublicRoomCategoryId
): PublicBedPreferenceId[] {
  return defaultBedPreferences[categoryId] ?? ["none"];
}

export function getBedPreferenceLabel(id: PublicBedPreferenceId): string {
  return PUBLIC_BED_PREFERENCES.find((p) => p.id === id)?.label ?? id;
}

export function getBedPreferenceOptions(categoryId: PublicRoomCategoryId) {
  const allowed = getBedPreferencesForCategory(categoryId);
  return PUBLIC_BED_PREFERENCES.filter((p) => allowed.includes(p.id));
}
