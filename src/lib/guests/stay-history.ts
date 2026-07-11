import { nightsBetween } from "@/lib/utils";
import type { Reservation } from "@/types/reservation";
import type { GuestStayRecord } from "@/types/guest";

export function getGuestStayHistory(
  guestId: string,
  reservations: Reservation[]
): GuestStayRecord[] {
  return reservations
    .filter((reservation) => reservation.guestId === guestId)
    .map((reservation) => ({
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNumber,
      roomNumber: reservation.roomNumber,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      amountPaid: reservation.amountPaid,
      status: reservation.status,
      nights: nightsBetween(reservation.checkInDate, reservation.checkOutDate),
    }))
    .sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
}
