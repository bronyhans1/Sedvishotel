import {
  reservationMatchesListFilters,
  type BookingSourceFilter,
  type ReservationListFilters,
} from "@/lib/reservations/list-order";
import type { Reservation } from "@/types/reservation";

export type { BookingSourceFilter };

export type ReservationFilterParams = ReservationListFilters;

export function filterReservations(
  reservations: Reservation[],
  params: ReservationFilterParams
): Reservation[] {
  return reservations.filter((reservation) =>
    reservationMatchesListFilters(reservation, params)
  );
}
