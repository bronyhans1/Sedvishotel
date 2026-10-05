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

const defaultFilters: ReservationFilterState = {
  search: "",
  status: "all",
  bookingSource: "all",
  roomTypeId: "all",
  dateFrom: "",
  dateTo: "",
};

export function parseReservationSearchParams(
  params: Record<string, string | string[] | undefined>
): ReservationFilterState {
  const next: ReservationFilterState = { ...defaultFilters };
  const source = typeof params.source === "string" ? params.source : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const roomType = typeof params.roomType === "string" ? params.roomType : undefined;
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : undefined;
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : undefined;

  if (source && VALID_SOURCES.has(source as BookingSourceFilter)) {
    next.bookingSource = source as BookingSourceFilter;
  }
  if (status && VALID_STATUSES.has(status as ReservationStatus | "all")) {
    next.status = status as ReservationStatus | "all";
  }
  if (search) next.search = search;
  if (roomType) next.roomTypeId = roomType;
  if (dateFrom) next.dateFrom = dateFrom;
  if (dateTo) next.dateTo = dateTo;

  return next;
}

export function buildReservationListQuery(
  filters: ReservationFilterState,
  page: number
): string {
  const qs = new URLSearchParams();
  if (filters.search.trim()) qs.set("search", filters.search.trim());
  if (filters.status !== "all") qs.set("status", filters.status);
  if (filters.bookingSource !== "all") qs.set("source", filters.bookingSource);
  if (filters.roomTypeId !== "all") qs.set("roomType", filters.roomTypeId);
  if (filters.dateFrom) qs.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) qs.set("dateTo", filters.dateTo);
  if (page > 1) qs.set("page", String(page));
  return qs.toString();
}
