import { guestMatchesListFilters } from "@/lib/guests/list-order";
import type { Guest, GuestStatus } from "@/types/guest";

export function filterGuests(
  guests: Guest[],
  search: string,
  status: GuestStatus | "all"
): Guest[] {
  return guests.filter((guest) =>
    guestMatchesListFilters(guest, { search, status })
  );
}
