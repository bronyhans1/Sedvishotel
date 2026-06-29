import type { DbReservationStatus, DbReservationWithRelations } from "@/types/database";
import { ServiceError } from "@/services/types";

const REJECTION_MESSAGES: Partial<Record<DbReservationStatus, string>> = {
  pending: "Reserved reservations cannot receive room charges.",
  confirmed: "Reserved reservations cannot receive room charges.",
  checked_out: "Checked-out guests cannot receive room charges.",
  checked_out_early: "Checked-out guests cannot receive room charges.",
  cancelled: "Cancelled reservations cannot receive room charges.",
  no_show: "No-show reservations cannot receive room charges.",
  completed: "Inactive reservations cannot receive room charges.",
};

export function getRoomChargeRejectionMessage(status: DbReservationStatus): string {
  return (
    REJECTION_MESSAGES[status] ??
    "Only checked-in reservations may receive room charges."
  );
}

/** Server-side guard — only checked-in reservations may receive room charges. */
export function assertReservationEligibleForRoomCharge(
  reservation: DbReservationWithRelations | null
): asserts reservation is DbReservationWithRelations {
  if (!reservation) {
    throw new ServiceError(
      "Select a checked-in guest to charge to room.",
      "VALIDATION",
      400
    );
  }

  if (reservation.status !== "checked_in") {
    throw new ServiceError(
      getRoomChargeRejectionMessage(reservation.status),
      "VALIDATION",
      400
    );
  }
}
