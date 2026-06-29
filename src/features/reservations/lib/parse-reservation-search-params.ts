import type { ReservationFilterState } from "@/components/reservations/ReservationFilters";
import type { BookingSourceFilter } from "@/features/reservations/lib/filter-reservations";
import type { ReservationStatus } from "@/types/reservation";

const VALID_SOURCES = new Set<BookingSourceFilter>([
  "all",
  "website",
  "reception",
  "walk_in",
  "phone",
]);

const VALID_STATUSES = new Set<ReservationStatus | "all">([
  "all",
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "checked_out_early",
  "cancelled",
  "no_show",
]);

export function parseReservationSearchParams(
  params: Record<string, string | string[] | undefined>
): Partial<ReservationFilterState> {
  const next: Partial<ReservationFilterState> = {};
  const source = typeof params.source === "string" ? params.source : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;

  if (source && VALID_SOURCES.has(source as BookingSourceFilter)) {
    next.bookingSource = source as BookingSourceFilter;
  }
  if (status && VALID_STATUSES.has(status as ReservationStatus | "all")) {
    next.status = status as ReservationStatus | "all";
  }

  return next;
}
