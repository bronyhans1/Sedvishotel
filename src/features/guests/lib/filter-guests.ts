import type { Guest, GuestStatus } from "@/types/guest";

export function filterGuests(
  guests: Guest[],
  search: string,
  status: GuestStatus | "all"
): Guest[] {
  const q = search.trim().toLowerCase();
  return guests.filter((g) => {
    if (status !== "all" && g.guestStatus !== status) return false;
    if (!q) return true;
    return (
      g.fullName.toLowerCase().includes(q) ||
      (g.email?.toLowerCase().includes(q) ?? false) ||
      (g.phone?.includes(q) ?? false)
    );
  });
}
