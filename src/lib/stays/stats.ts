import { getTodayDateString } from "@/lib/dates/today";
import type { Reservation } from "@/types/reservation";
import type { ActiveStay, StayStats } from "@/types/stay";

export function computeStayStats(
  stays: ActiveStay[],
  reservations: Reservation[],
  today: string = getTodayDateString()
): StayStats {
  const occupiedRooms = new Set(stays.map((s) => s.roomNumber)).size;
  return {
    guestsInHouse: stays.length,
    roomsOccupied: occupiedRooms,
    arrivalsToday: reservations.filter(
      (r) =>
        r.checkInDate === today &&
        (r.status === "confirmed" || r.status === "checked_in")
    ).length,
    departuresToday: reservations.filter(
      (r) => r.checkOutDate === today && r.status === "checked_in"
    ).length,
  };
}
