import { resolveEffectiveCheckOutDate } from "@/lib/reservations/effective-checkout-date";
import type { BookingSource, ReservationStatus } from "@/types/reservation";

export type BookingSourceFilter = BookingSource | "all" | "reception";

export type ReservationListFilters = {
  search: string;
  status: ReservationStatus | "all";
  bookingSource: BookingSourceFilter;
  roomTypeId: string | "all";
  dateFrom: string;
  dateTo: string;
};

/** Fields the reservations list filter and operational order actually read. */
export type ReservationListRow = {
  id: string;
  status: ReservationStatus;
  bookingSource: BookingSource;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  actualCheckOutDate: string | null;
  reservationNumber: string;
  guestName: string;
  roomNumber: string;
};

function dateOnly(value: string | null | undefined): string {
  return (value ?? "").slice(0, 10);
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function matchesBookingSource(
  bookingSource: BookingSource,
  filter: BookingSourceFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "reception") {
    return !["website", "walk_in"].includes(bookingSource);
  }
  return bookingSource === filter;
}

/**
 * Same predicate the reservations screen used in the browser.
 * Room matching stays case-sensitive against the lowercased term and still
 * accepts a zero-padded three-character room number.
 */
export function reservationMatchesListFilters(
  reservation: ReservationListRow,
  params: ReservationListFilters
): boolean {
  if (params.status !== "all" && reservation.status !== params.status) return false;
  if (!matchesBookingSource(reservation.bookingSource, params.bookingSource)) return false;
  if (params.roomTypeId !== "all" && reservation.roomTypeId !== params.roomTypeId) {
    return false;
  }
  if (
    params.dateFrom &&
    resolveEffectiveCheckOutDate(reservation) < params.dateFrom
  ) {
    return false;
  }
  if (params.dateTo && reservation.checkInDate > params.dateTo) return false;

  const search = params.search.trim().toLowerCase();
  if (!search) return true;
  return (
    reservation.reservationNumber.toLowerCase().includes(search) ||
    reservation.guestName.toLowerCase().includes(search) ||
    reservation.roomNumber.includes(search) ||
    reservation.roomNumber === search.padStart(3, "0")
  );
}

/**
 * List-only rank. Checked-in stays outrank a passed departure date.
 * Pending and confirmed arrivals use the business date, not the wall clock.
 */
export function reservationListRank(
  reservation: Pick<ReservationListRow, "status" | "checkInDate">,
  businessDate: string
): number {
  const checkIn = dateOnly(reservation.checkInDate);
  if (reservation.status === "checked_in") return 0;
  if (
    (reservation.status === "pending" || reservation.status === "confirmed") &&
    checkIn === businessDate
  ) {
    return 1;
  }
  if (
    (reservation.status === "pending" || reservation.status === "confirmed") &&
    checkIn > businessDate
  ) {
    return 2;
  }
  if (
    reservation.status === "checked_out" ||
    reservation.status === "checked_out_early"
  ) {
    return 3;
  }
  return 4;
}

function departureDate(reservation: ReservationListRow): string {
  const actual = dateOnly(reservation.actualCheckOutDate);
  if (actual) return actual;
  return dateOnly(reservation.checkOutDate);
}

export function compareReservationListOrder(
  a: ReservationListRow,
  b: ReservationListRow,
  businessDate: string
): number {
  const byRank = reservationListRank(a, businessDate) - reservationListRank(b, businessDate);
  if (byRank !== 0) return byRank;

  const rank = reservationListRank(a, businessDate);
  if (rank === 0) {
    return (
      compareText(a.roomNumber, b.roomNumber) ||
      compareText(a.guestName, b.guestName) ||
      compareText(a.reservationNumber, b.reservationNumber) ||
      a.id.localeCompare(b.id)
    );
  }
  if (rank === 1) {
    return (
      compareText(a.reservationNumber, b.reservationNumber) ||
      compareText(a.guestName, b.guestName) ||
      a.id.localeCompare(b.id)
    );
  }
  if (rank === 2) {
    return (
      dateOnly(a.checkInDate).localeCompare(dateOnly(b.checkInDate)) ||
      compareText(a.reservationNumber, b.reservationNumber) ||
      compareText(a.guestName, b.guestName) ||
      a.id.localeCompare(b.id)
    );
  }
  if (rank === 3) {
    return (
      departureDate(b).localeCompare(departureDate(a)) ||
      compareText(a.guestName, b.guestName) ||
      compareText(a.reservationNumber, b.reservationNumber) ||
      a.id.localeCompare(b.id)
    );
  }
  return (
    dateOnly(b.checkInDate).localeCompare(dateOnly(a.checkInDate)) ||
    compareText(a.reservationNumber, b.reservationNumber) ||
    compareText(a.guestName, b.guestName) ||
    a.id.localeCompare(b.id)
  );
}

export function sortReservationListRows<T extends ReservationListRow>(
  rows: readonly T[],
  businessDate: string
): T[] {
  return [...rows].sort((a, b) => compareReservationListOrder(a, b, businessDate));
}
