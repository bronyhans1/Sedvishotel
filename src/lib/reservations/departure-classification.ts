import { getCurrentTimeString, timeToMinutes } from "@/lib/dates/time";
import { nightsBetween } from "@/lib/utils";

/**
 * Unified front-desk departure / stay classification (Phase 3).
 * Operational only — no billing, folio posting, or penalties.
 */
export type DepartureClassification =
  | "expected_departure"
  | "late_checkout"
  | "overstay"
  | "in_house"
  | "checked_out"
  | "checked_out_early"
  | "cancelled"
  | "no_show"
  | "pending"
  | "confirmed";

export type DepartureClassificationInput = {
  status: string;
  checkInDate: string;
  /** Scheduled check-out date (stay end). */
  scheduledCheckOutDate: string;
  /** Operational Business Date (YYYY-MM-DD). */
  businessDate: string;
  /** Local HH:mm — defaults to now when omitted. */
  currentTime?: string;
  /** Hotel policy checkout time HH:mm. */
  policyCheckOutTime: string;
};

export type DepartureClassificationResult = {
  classification: DepartureClassification;
  label: string;
  /** Short operational label for badges. */
  shortLabel: string;
  tone: "expected" | "late" | "overstay" | "neutral" | "success" | "danger";
  /** Days past scheduled checkout (overstay only). */
  overstayDays: number;
  isCheckedIn: boolean;
  /** Primary check-out action for front desk. */
  primaryAction:
    | "none"
    | "check_out"
    | "late_check_out"
    | "overstay_check_out"
    | "early_check_out";
};

const LABELS: Record<DepartureClassification, { label: string; shortLabel: string }> = {
  expected_departure: {
    label: "Expected Departure",
    shortLabel: "Expected Departure",
  },
  late_checkout: {
    label: "Late Check-Out",
    shortLabel: "Late Check-Out",
  },
  overstay: {
    label: "Overstay",
    shortLabel: "Overstay",
  },
  in_house: {
    label: "In House",
    shortLabel: "In House",
  },
  checked_out: {
    label: "Checked Out",
    shortLabel: "Checked Out",
  },
  checked_out_early: {
    label: "Checked Out Early",
    shortLabel: "Early Check-Out",
  },
  cancelled: {
    label: "Cancelled",
    shortLabel: "Cancelled",
  },
  no_show: {
    label: "No Show",
    shortLabel: "No Show",
  },
  pending: {
    label: "Pending",
    shortLabel: "Pending",
  },
  confirmed: {
    label: "Confirmed",
    shortLabel: "Confirmed",
  },
};

export function resolveDepartureClassification(
  input: DepartureClassificationInput
): DepartureClassificationResult {
  const {
    status,
    scheduledCheckOutDate,
    businessDate,
    policyCheckOutTime,
  } = input;
  const currentTime = input.currentTime ?? getCurrentTimeString();

  if (status === "cancelled") {
    return result("cancelled", "neutral", 0, false, "none");
  }
  if (status === "no_show") {
    return result("no_show", "danger", 0, false, "none");
  }
  if (status === "checked_out_early") {
    return result("checked_out_early", "success", 0, false, "none");
  }
  if (status === "checked_out" || status === "checked_out_late") {
    return result("checked_out", "success", 0, false, "none");
  }
  if (status === "pending") {
    return result("pending", "neutral", 0, false, "none");
  }
  if (status === "confirmed") {
    return result("confirmed", "neutral", 0, false, "none");
  }

  if (status !== "checked_in") {
    return result("in_house", "neutral", 0, false, "none");
  }

  if (businessDate > scheduledCheckOutDate) {
    const overstayDays = Math.max(
      1,
      nightsBetween(scheduledCheckOutDate, businessDate)
    );
    return result("overstay", "overstay", overstayDays, true, "overstay_check_out");
  }

  if (businessDate === scheduledCheckOutDate) {
    const isLate =
      timeToMinutes(currentTime) > timeToMinutes(policyCheckOutTime);
    if (isLate) {
      return result("late_checkout", "late", 0, true, "late_check_out");
    }
    return result("expected_departure", "expected", 0, true, "check_out");
  }

  // businessDate < scheduledCheckOutDate
  return result("in_house", "neutral", 0, true, "early_check_out");
}

function result(
  classification: DepartureClassification,
  tone: DepartureClassificationResult["tone"],
  overstayDays: number,
  isCheckedIn: boolean,
  primaryAction: DepartureClassificationResult["primaryAction"]
): DepartureClassificationResult {
  const labels = LABELS[classification];
  return {
    classification,
    label: labels.label,
    shortLabel: labels.shortLabel,
    tone,
    overstayDays,
    isCheckedIn,
    primaryAction,
  };
}

/** Partition checked-in reservations for Check-Out queues. */
export function partitionDepartureQueues<
  T extends {
    status: string;
    checkInDate: string;
    checkOutDate: string;
  },
>(
  reservations: T[],
  businessDate: string,
  policyCheckOutTime: string,
  currentTime?: string
): {
  expected: T[];
  late: T[];
  overstay: T[];
  other: T[];
} {
  const expected: T[] = [];
  const late: T[] = [];
  const overstay: T[] = [];
  const other: T[] = [];

  for (const reservation of reservations) {
    const resolved = resolveDepartureClassification({
      status: reservation.status,
      checkInDate: reservation.checkInDate,
      scheduledCheckOutDate: reservation.checkOutDate,
      businessDate,
      policyCheckOutTime,
      currentTime,
    });
    switch (resolved.classification) {
      case "expected_departure":
        expected.push(reservation);
        break;
      case "late_checkout":
        late.push(reservation);
        break;
      case "overstay":
        overstay.push(reservation);
        break;
      default:
        other.push(reservation);
        break;
    }
  }

  return { expected, late, overstay, other };
}

export function countDepartureClassifications(
  reservations: Array<{
    status: string;
    checkInDate: string;
    checkOutDate: string;
  }>,
  businessDate: string,
  policyCheckOutTime: string,
  currentTime?: string
): {
  expectedDepartures: number;
  lateCheckOuts: number;
  overstays: number;
  averageOverstayDays: number;
} {
  const { expected, late, overstay } = partitionDepartureQueues(
    reservations,
    businessDate,
    policyCheckOutTime,
    currentTime
  );

  let overstayDaySum = 0;
  for (const reservation of overstay) {
    const resolved = resolveDepartureClassification({
      status: reservation.status,
      checkInDate: reservation.checkInDate,
      scheduledCheckOutDate: reservation.checkOutDate,
      businessDate,
      policyCheckOutTime,
      currentTime,
    });
    overstayDaySum += resolved.overstayDays;
  }

  return {
    expectedDepartures: expected.length,
    lateCheckOuts: late.length,
    overstays: overstay.length,
    averageOverstayDays:
      overstay.length > 0
        ? Math.round((overstayDaySum / overstay.length) * 10) / 10
        : 0,
  };
}
