import type { DbReservationStatus } from "@/types/database/enums";

export const RESERVATION_LOOKUP_STAGES = [
  "Reservation Submitted",
  "Pending Review",
  "Confirmed",
  "Checked-In",
  "Checked-Out",
] as const;

export type ReservationLookupStageState = "completed" | "current" | "upcoming";

export type ReservationLookupTimeline =
  | { kind: "progress"; stages: ReservationLookupStageState[] }
  | { kind: "cancelled" }
  | { kind: "no_show" };

/** Maps existing DB reservation statuses to guest-facing lookup timeline states. */
export function buildReservationLookupTimeline(
  status: DbReservationStatus
): ReservationLookupTimeline {
  if (status === "cancelled") {
    return { kind: "cancelled" };
  }
  if (status === "no_show") {
    return { kind: "no_show" };
  }

  let currentIndex: number;
  let allComplete = false;

  switch (status) {
    case "pending":
      currentIndex = 1;
      break;
    case "confirmed":
      currentIndex = 2;
      break;
    case "checked_in":
      currentIndex = 3;
      break;
    case "checked_out":
    case "checked_out_early":
    case "completed":
      currentIndex = 4;
      allComplete = true;
      break;
    default:
      currentIndex = 1;
  }

  const stages = RESERVATION_LOOKUP_STAGES.map((_, index) => {
    if (allComplete || index < currentIndex) return "completed";
    if (index === currentIndex) return "current";
    return "upcoming";
  });

  return { kind: "progress", stages };
}
