import type { Reservation, ReservationStatus, BookingSource } from "@/types/reservation";

export type ReservationFilterParams = {
  search: string;
  status: ReservationStatus | "all";
  bookingSource: BookingSource | "all";
  roomTypeId: string | "all";
  dateFrom: string;
  dateTo: string;
};

export function filterReservations(
  reservations: Reservation[],
  params: ReservationFilterParams
): Reservation[] {
  const search = params.search.trim().toLowerCase();

  return reservations.filter((r) => {
    if (params.status !== "all" && r.status !== params.status) return false;
    if (
      params.bookingSource !== "all" &&
      r.bookingSource !== params.bookingSource
    )
      return false;
    if (params.roomTypeId !== "all" && r.roomTypeId !== params.roomTypeId)
      return false;

    if (params.dateFrom && r.checkOutDate < params.dateFrom) return false;
    if (params.dateTo && r.checkInDate > params.dateTo) return false;

    if (search) {
      return (
        r.reservationNumber.toLowerCase().includes(search) ||
        r.guestName.toLowerCase().includes(search) ||
        r.roomNumber.includes(search) ||
        r.roomNumber === search.padStart(3, "0")
      );
    }

    return true;
  });
}
