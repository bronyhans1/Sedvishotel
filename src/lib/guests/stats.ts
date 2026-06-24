import type { Guest, GuestStats } from "@/types/guest";

/** KPI computation from live guest inventory (same cards as mock module). */
export function computeGuestStats(guests: Guest[]): GuestStats {
  return {
    totalGuests: guests.length,
    currentGuests: guests.filter((g) => g.guestStatus === "in_house").length,
    returningGuests: guests.filter((g) => g.totalVisits > 1).length,
    vipGuests: guests.filter((g) => g.vipStatus).length,
    checkInsToday: guests.filter((g) => g.guestStatus === "in_house").length,
    checkOutsToday: guests.filter((g) => g.guestStatus === "checked_out").length,
  };
}
