import { MOCK_TODAY } from "@/config/mock-dates";
import { findGuestByEmail } from "@/lib/mock-data/guests";
import { nightsBetween } from "@/lib/utils";
import type { Reservation } from "@/types/reservation";
import type { ActiveStay, StayStats } from "@/types/stay";

export function reservationToStay(reservation: Reservation): ActiveStay | null {
  if (reservation.status !== "checked_in") return null;

  const guest = findGuestByEmail(reservation.guestEmail);

  return {
    id: `stay_${reservation.id}`,
    reservationId: reservation.id,
    reservationNumber: reservation.reservationNumber,
    guestId: guest?.id ?? "",
    guestName: reservation.guestName,
    guestPhone: reservation.guestPhone,
    guestEmail: reservation.guestEmail,
    roomNumber: reservation.roomNumber,
    roomTypeName: reservation.roomTypeName,
    floorLabel: reservation.floorLabel,
    checkInDate: reservation.checkInDate,
    expectedCheckOut: reservation.checkOutDate,
    status: reservation.status,
    guestStatus: guest?.guestStatus ?? "in_house",
    balance: reservation.balance,
    specialRequests: guest?.notes ?? [],
    nights: reservation.numberOfNights,
  };
}

export function buildActiveStays(
  reservations: Reservation[]
): ActiveStay[] {
  return reservations
    .map(reservationToStay)
    .filter((s): s is ActiveStay => s !== null);
}

export function computeStayStats(
  stays: ActiveStay[],
  reservations: Reservation[]
): StayStats {
  const occupiedRooms = new Set(stays.map((s) => s.roomNumber)).size;
  return {
    guestsInHouse: stays.length,
    roomsOccupied: occupiedRooms,
    arrivalsToday: reservations.filter(
      (r) =>
        r.checkInDate === MOCK_TODAY &&
        (r.status === "confirmed" || r.status === "checked_in")
    ).length,
    departuresToday: reservations.filter(
      (r) => r.checkOutDate === MOCK_TODAY && r.status === "checked_in"
    ).length,
  };
}

export function getGuestStayHistory(
  guestEmail: string,
  reservations: Reservation[]
) {
  return reservations
    .filter((r) => r.guestEmail.toLowerCase() === guestEmail.toLowerCase())
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
