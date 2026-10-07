export const GUEST_TBD_LABEL = "Guest TBD";

const NON_IDENTITY_GUEST_NAMES = new Set(["guest tbd"]);

export type AssignableGuest = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
};

/** A placeholder assignment must carry a real guest id. The group name is never a substitute. */
export function placeholderReservationGuest(
  guest: AssignableGuest | null
): {
  guestId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
} | null {
  const id = guest?.id.trim() ?? "";
  const fullName = guest?.fullName.trim() ?? "";
  if (!id || !fullName) return null;
  return {
    guestId: id,
    guestName: fullName,
    guestPhone: guest?.phone.trim() ?? "",
    guestEmail: guest?.email.trim() ?? "",
  };
}

export function placeholderGuestLabel(guest: AssignableGuest | null): string {
  return guest?.fullName.trim() || GUEST_TBD_LABEL;
}

/** Repeated real guest names. Blank names and Guest TBD placeholders are not identities. */
export function repeatedGuestIdentityNames(names: string[]): string[] {
  const identity = names
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length > 0 && !NON_IDENTITY_GUEST_NAMES.has(name));
  return identity.filter((name, index) => identity.indexOf(name) !== index);
}
