import {
  BOOKING_SOURCE_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  type BookingSource,
  type Reservation,
  type ReservationStatus,
} from "@/types/reservation";

const sourceLabels = Object.fromEntries(
  BOOKING_SOURCE_OPTIONS.map((o) => [o.value, o.label])
) as Record<BookingSource, string>;

const statusLabels = Object.fromEntries(
  RESERVATION_STATUS_OPTIONS.map((o) => [o.value, o.label])
) as Record<ReservationStatus, string>;

export function resolveBookingSourceLabel(source: BookingSource): string {
  return sourceLabels[source] ?? source;
}

export function resolveReservationStatusLabel(status: ReservationStatus): string {
  return statusLabels[status] ?? status;
}

export function resolveReservationCreatedByLabel(
  reservation: Pick<Reservation, "bookingSource" | "createdById">
): string {
  if (reservation.bookingSource === "website") {
    return resolveBookingSourceLabel("website");
  }
  if (reservation.createdById) {
    return "Reception Staff";
  }
  return resolveBookingSourceLabel(reservation.bookingSource);
}

export function formatReservationSubmittedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
