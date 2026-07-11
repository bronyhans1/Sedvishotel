import type { Guest, GuestStats } from "@/types/guest";

export type GuestStatsInput = {
  guests: Guest[];
  checkInsToday: number;
  checkOutsToday: number;
};

/** KPI computation from live guest inventory and today's stay events. */
export function computeGuestStats(input: GuestStatsInput): GuestStats {
  const { guests, checkInsToday, checkOutsToday } = input;

  return {
    totalGuests: guests.length,
    currentGuests: guests.filter((guest) => guest.guestStatus === "in_house")
      .length,
    returningGuests: guests.filter((guest) => guest.totalVisits > 1).length,
    vipGuests: guests.filter((guest) => guest.vipStatus).length,
    checkInsToday,
    checkOutsToday,
  };
}

export function getLocalDayBounds(): { startIso: string; endIso: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}
