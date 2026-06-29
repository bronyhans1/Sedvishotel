import type { Reservation } from "@/types/reservation";

/** Pending website reservations for the dashboard review queue (newest first). */
export function selectPendingWebsiteReservations(
  reservations: Reservation[]
): Reservation[] {
  return reservations
    .filter(
      (r) => r.bookingSource === "website" && r.status === "pending"
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const PENDING_WEBSITE_RESERVATIONS_HREF =
  "/dashboard/reservations?source=website&status=pending";
