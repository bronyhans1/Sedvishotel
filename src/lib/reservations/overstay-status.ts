import { nightsBetween } from "@/lib/utils";
import { resolveDepartureClassification } from "@/lib/reservations/departure-classification";
import type {
  OverstayChargeStatus,
  OverstayFinancialStatus,
  OverstayLifecycleStatus,
} from "@/types/overstay";

/**
 * Shared overstay lifecycle resolver (Phase 4).
 * Combines Phase 3 departure classification with charge ledger status.
 * No page should implement this independently.
 */
export function resolveOverstayStatus(input: {
  status: string;
  checkInDate: string;
  scheduledCheckOutDate: string;
  businessDate: string;
  policyCheckOutTime: string;
  currentTime?: string;
  /** Latest / relevant overstay charge status for this reservation. */
  chargeStatus?: OverstayChargeStatus | null;
}): {
  lifecycle: OverstayLifecycleStatus;
  financialStatus: OverstayFinancialStatus;
  departureClassification: ReturnType<
    typeof resolveDepartureClassification
  >["classification"];
  overstayDays: number;
  label: string;
} {
  const departure = resolveDepartureClassification({
    status: input.status,
    checkInDate: input.checkInDate,
    scheduledCheckOutDate: input.scheduledCheckOutDate,
    businessDate: input.businessDate,
    policyCheckOutTime: input.policyCheckOutTime,
    currentTime: input.currentTime,
  });

  const financialStatus = mapChargeToFinancial(input.chargeStatus ?? null);

  if (
    departure.classification === "checked_out" ||
    departure.classification === "checked_out_early"
  ) {
    return {
      lifecycle: "checked_out",
      financialStatus,
      departureClassification: departure.classification,
      overstayDays: 0,
      label: departure.label,
    };
  }

  if (departure.classification !== "overstay") {
    const lifecycle = mapDepartureToLifecycle(departure.classification);
    return {
      lifecycle,
      financialStatus:
        departure.classification === "expected_departure" ||
        departure.classification === "late_checkout" ||
        departure.classification === "in_house"
          ? "none"
          : financialStatus,
      departureClassification: departure.classification,
      overstayDays: 0,
      label: departure.label,
    };
  }

  const overstayDays = Math.max(
    1,
    nightsBetween(input.scheduledCheckOutDate, input.businessDate)
  );

  if (input.chargeStatus === "pending") {
    return {
      lifecycle: "overstay_charge_pending",
      financialStatus: "pending_charge",
      departureClassification: "overstay",
      overstayDays,
      label: "Overstay Charge Pending",
    };
  }
  if (input.chargeStatus === "posted" || input.chargeStatus === "approved") {
    return {
      lifecycle:
        input.chargeStatus === "posted" ? "charge_posted" : "overstay_charge_pending",
      financialStatus: input.chargeStatus === "posted" ? "posted" : "approved",
      departureClassification: "overstay",
      overstayDays,
      label: input.chargeStatus === "posted" ? "Charge Posted" : "Overstay (Approved)",
    };
  }
  if (input.chargeStatus === "waived") {
    return {
      lifecycle: "waived",
      financialStatus: "waived",
      departureClassification: "overstay",
      overstayDays,
      label: "Waived",
    };
  }

  return {
    lifecycle: "overstay",
    financialStatus,
    departureClassification: "overstay",
    overstayDays,
    label: "Overstay",
  };
}

function mapChargeToFinancial(
  status: OverstayChargeStatus | null
): OverstayFinancialStatus {
  switch (status) {
    case "pending":
      return "pending_charge";
    case "approved":
      return "approved";
    case "waived":
      return "waived";
    case "posted":
      return "posted";
    case "rejected":
      return "rejected";
    case "skipped":
      return "skipped";
    default:
      return "none";
  }
}

function mapDepartureToLifecycle(
  classification: ReturnType<
    typeof resolveDepartureClassification
  >["classification"]
): OverstayLifecycleStatus {
  switch (classification) {
    case "expected_departure":
      return "expected_departure";
    case "late_checkout":
      return "late_checkout";
    case "overstay":
      return "overstay";
    case "in_house":
      return "checked_in";
    default:
      return "checked_in";
  }
}

/** Stable folio / ledger source reference — uniqueness key. */
export function buildOverstaySourceReference(
  reservationId: string,
  businessDate: string
): string {
  return `overstay:${reservationId}:${businessDate}`;
}

export function buildOverstayFolioDescription(input: {
  roomNumber: string;
  businessDate: string;
  nights?: number;
}): string {
  const nights = input.nights ?? 1;
  return [
    "Overstay Charge",
    `Room ${input.roomNumber || "—"}`,
    `Business Date: ${input.businessDate}`,
    `${nights} Additional Night${nights === 1 ? "" : "s"}`,
  ].join(" · ");
}
