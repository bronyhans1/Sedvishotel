import { resolveDepartureClassification } from "@/lib/reservations/departure-classification";
import { buildOverstaySourceReference } from "@/lib/reservations/overstay-status";
import { nightsBetween } from "@/lib/utils";
import type {
  OverstayCheckoutChargeState,
  OverstayCheckoutValidation,
  OverstayCheckoutUxStatus,
} from "@/types/overstay-checkout";
import type { OverstayCharge, OverstayPolicy } from "@/types/overstay";

export type ValidateOverstayCheckoutInput = {
  reservationId: string;
  status: string;
  checkInDate: string;
  scheduledCheckOutDate: string;
  businessDate: string;
  policyCheckOutTime: string;
  currentPolicy: OverstayPolicy;
  ledgerChargeForBusinessDate: OverstayCharge | null;
  folioSourceReferences: string[];
  canManageOverstay: boolean;
};

function mapLedgerToChargeState(
  charge: OverstayCharge | null
): OverstayCheckoutChargeState {
  if (!charge) return "no_charge";
  switch (charge.status) {
    case "posted":
      return "posted";
    case "pending":
      return "pending";
    case "waived":
      return "waived";
    case "rejected":
      return "rejected";
    case "skipped":
      return "skipped";
    case "approved":
      return "pending";
    default:
      return "no_charge";
  }
}

function policiesDiffer(
  snapshot: OverstayPolicy | null,
  current: OverstayPolicy
): boolean {
  if (!snapshot) return false;
  return (
    snapshot.chargeMode !== current.chargeMode ||
    snapshot.managerApprovalRequired !== current.managerApprovalRequired
  );
}

/**
 * Read-only overstay checkout validation pipeline (v2.4.1).
 * Does not mutate ledger, folio, or reservations.
 */
export function validateOverstayCheckout(
  input: ValidateOverstayCheckoutInput
): OverstayCheckoutValidation {
  const departure = resolveDepartureClassification({
    status: input.status,
    checkInDate: input.checkInDate,
    scheduledCheckOutDate: input.scheduledCheckOutDate,
    businessDate: input.businessDate,
    policyCheckOutTime: input.policyCheckOutTime,
  });

  const isOverstay = departure.classification === "overstay";
  const overstayDays = isOverstay
    ? Math.max(
        1,
        nightsBetween(input.scheduledCheckOutDate, input.businessDate)
      )
    : 0;

  const ledger = input.ledgerChargeForBusinessDate;
  const chargeState = mapLedgerToChargeState(ledger);
  const businessDateEvaluated = ledger !== null;
  const evaluationPolicy = ledger?.policySnapshot ?? null;
  const policyChangedAfterEvaluation = policiesDiffer(
    evaluationPolicy,
    input.currentPolicy
  );

  const expectedSourceRef = buildOverstaySourceReference(
    input.reservationId,
    input.businessDate
  );
  const chargeOnFolio = input.folioSourceReferences.includes(expectedSourceRef);
  const missingFolioIntegration =
    chargeState === "posted" && Boolean(ledger) && !chargeOnFolio;

  const messages: string[] = [];
  let uxStatus: OverstayCheckoutUxStatus = "no_charge";
  let checkoutAllowed = true;
  let checkoutBlockedReason: string | null = null;
  let recoveryAvailable = false;
  let recoveryReason: string | null = null;

  if (!isOverstay) {
    return {
      reservationId: input.reservationId,
      isOverstay: false,
      businessDate: input.businessDate,
      scheduledCheckOutDate: input.scheduledCheckOutDate,
      overstayDays: 0,
      chargeState: "no_charge",
      ledgerCharge: ledger,
      businessDateEvaluated,
      chargeOnFolio: false,
      missingFolioIntegration: false,
      currentPolicy: input.currentPolicy,
      evaluationPolicy,
      policyChangedAfterEvaluation: false,
      checkoutAllowed: true,
      checkoutBlockedReason: null,
      recoveryAvailable: false,
      recoveryReason: null,
      uxStatus: "no_charge",
      messages: [],
    };
  }

  switch (chargeState) {
    case "posted":
      uxStatus = "posted";
      messages.push("Overstay charge posted to Guest Folio.");
      if (missingFolioIntegration) {
        messages.push(
          "Ledger shows posted but folio entry is missing — recovery may re-post safely."
        );
        recoveryAvailable = input.canManageOverstay;
        recoveryReason =
          "Posted ledger without folio integration — safe to re-post via recovery.";
      }
      break;
    case "pending":
      uxStatus = "pending_approval";
      messages.push("Manager approval required before checkout can continue.");
      if (!input.canManageOverstay) {
        checkoutAllowed = false;
        checkoutBlockedReason =
          "Pending overstay charge requires manager approval before check-out.";
      } else {
        messages.push(
          "Manager may approve from the check-out list or proceed after approval."
        );
      }
      break;
    case "waived":
      uxStatus = "waived";
      messages.push("Overstay charge waived — proceed with check-out.");
      break;
    case "rejected":
      uxStatus = "rejected";
      messages.push("Overstay charge rejected — proceed with check-out.");
      break;
    case "skipped":
      uxStatus = "skipped";
      messages.push(
        `Policy at Night Audit: ${evaluationPolicy?.chargeMode === "none" ? "No Automatic Charge" : "Charge skipped"}.`
      );
      messages.push("No overstay charge exists for this Business Date.");
      if (
        policyChangedAfterEvaluation &&
        input.currentPolicy.chargeMode !== "none"
      ) {
        uxStatus = "policy_changed_notice";
        messages.push(
          "Hotel policy changed after today's Night Audit evaluation."
        );
        messages.push(
          "Today's overstay evaluation used the previous policy. Use Recovery Evaluation if management wishes to apply the new policy."
        );
        if (input.canManageOverstay) {
          recoveryAvailable = true;
          recoveryReason =
            "Skipped under previous policy — current policy allows charging.";
        }
      }
      break;
    case "no_charge":
      uxStatus = "no_charge";
      if (input.currentPolicy.chargeMode === "none") {
        messages.push("No Automatic Charge policy — no overstay charge expected.");
      } else {
        messages.push(
          "No overstay ledger row for this Business Date — evaluation may not have run."
        );
        if (input.canManageOverstay) {
          recoveryAvailable = true;
          recoveryReason =
            "Missing ledger for current Business Date — safe to evaluate via Overstay Engine.";
        }
      }
      break;
  }

  if (
    recoveryAvailable &&
    chargeState !== "posted" &&
    uxStatus !== "policy_changed_notice"
  ) {
    uxStatus = "recovery_available";
  }

  return {
    reservationId: input.reservationId,
    isOverstay: true,
    businessDate: input.businessDate,
    scheduledCheckOutDate: input.scheduledCheckOutDate,
    overstayDays,
    chargeState,
    ledgerCharge: ledger,
    businessDateEvaluated,
    chargeOnFolio,
    missingFolioIntegration,
    currentPolicy: input.currentPolicy,
    evaluationPolicy,
    policyChangedAfterEvaluation,
    checkoutAllowed,
    checkoutBlockedReason,
    recoveryAvailable,
    recoveryReason,
    uxStatus,
    messages,
  };
}
