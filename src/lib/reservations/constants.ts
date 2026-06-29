import type { DbReservationStatus } from "@/types/database";

/** Statuses that block room availability for overlapping dates. */
export const BLOCKING_RESERVATION_STATUSES: DbReservationStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
];
