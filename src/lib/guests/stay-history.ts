import { nightsBetween } from "@/lib/utils";
import type { Reservation } from "@/types/reservation";
import type { GuestStayRecord } from "@/types/guest";

export function getGuestStayHistory(
  guestEmail: string,
  reservations: Reservation[]
): GuestStayRecord[] {
  const normalized = guestEmail.trim().toLowerCase();
  return reservations
    .filter((r) => r.guestEmail.toLowerCase() === normalized)
    .map((r) => ({
      reservationId: r.id,
      reservationNumber: r.reservationNumber,
      roomNumber: r.roomNumber,
      checkInDate: r.checkInDate,
      checkOutDate: r.checkOutDate,
      amountPaid: r.amountPaid,
      status: r.status,
      nights: nightsBetween(r.checkInDate, r.checkOutDate),
    }));
}
