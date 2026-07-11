import { roundCurrency } from "@/lib/payments/currency";
import type {
  BookingPaymentLifecycleStatus,
  BookingPaymentPolicy,
} from "@/types/booking-payment";
import type { PaymentStatus } from "@/types/payment";

export type BookingPaymentLifecycleInput = {
  /** Current wizard step (1-based). */
  wizardStep: number;
  totalAmount: number;
  amountPaid: number;
  paymentPolicy: BookingPaymentPolicy;
  roomSelected: boolean;
};

export type CollectionPaymentLifecycleInput = {
  totalAmount: number;
  alreadyPaid: number;
  collectionAmount: number;
  paymentPolicy?: BookingPaymentPolicy;
};

/**
 * Derives reception payment lifecycle from totals, policy, and wizard progress.
 * Never infers "paid" from room selection alone — only from amount + policy.
 */
export function resolveBookingPaymentLifecycle(
  input: BookingPaymentLifecycleInput
): BookingPaymentLifecycleStatus {
  return resolveCollectionPaymentLifecycle({
    totalAmount: input.totalAmount,
    alreadyPaid: 0,
    collectionAmount: input.wizardStep >= 4 ? input.amountPaid : 0,
    paymentPolicy: input.paymentPolicy,
    wizardStep: input.wizardStep,
    roomSelected: input.roomSelected,
  });
}

/**
 * Canonical lifecycle for payment collection UIs (Record Payment, walk-in step 4+).
 * Uses already-paid ledger + draft collection amount — never projects full payment when collection is 0.
 */
export function resolveCollectionPaymentLifecycle(
  input: CollectionPaymentLifecycleInput & {
    wizardStep?: number;
    roomSelected?: boolean;
  }
): BookingPaymentLifecycleStatus {
  const total = roundCurrency(Math.max(0, input.totalAmount));
  const alreadyPaid = roundCurrency(Math.max(0, input.alreadyPaid));
  const collecting = roundCurrency(Math.max(0, input.collectionAmount));
  const policy = input.paymentPolicy ?? "collect_now";

  if (
    input.wizardStep != null &&
    (input.wizardStep < 3 || !input.roomSelected)
  ) {
    return "not_started";
  }

  if (policy === "complimentary" || total <= 0) {
    return "complimentary";
  }

  if (input.wizardStep === 3) {
    if (policy === "company_billing") return "company_billing";
    if (policy === "pay_at_check_out") return "pay_at_check_out";
    return "awaiting_payment";
  }

  if (policy === "company_billing") {
    return "company_billing";
  }

  if (policy === "pay_at_check_out" && collecting <= 0) {
    return "pay_at_check_out";
  }

  const projectedPaid = roundCurrency(alreadyPaid + collecting);
  const balance = roundCurrency(Math.max(0, total - projectedPaid));

  if (collecting <= 0 && alreadyPaid <= 0 && total > 0) {
    return "awaiting_payment";
  }

  if (balance <= 0 && projectedPaid > 0) {
    return "paid";
  }

  if (projectedPaid > 0 && balance > 0) {
    return "partially_paid";
  }

  if (alreadyPaid > 0 && collecting <= 0) {
    return balance <= 0 ? "paid" : "partially_paid";
  }

  return "awaiting_payment";
}

/** Maps lifecycle to committed ledger status after booking is saved. */
export function mapBookingLifecycleToPaymentStatus(
  lifecycle: BookingPaymentLifecycleStatus,
  totalAmount: number,
  amountPaid: number
): PaymentStatus {
  const total = roundCurrency(totalAmount);
  const paid = roundCurrency(amountPaid);
  const balance = roundCurrency(Math.max(0, total - paid));

  if (lifecycle === "complimentary" || (total <= 0 && paid <= 0)) {
    return "paid";
  }

  if (lifecycle === "pay_at_check_out" || lifecycle === "company_billing") {
    return paid > 0 ? (balance > 0 ? "partial" : "paid") : "pending";
  }

  if (balance <= 0 && paid > 0) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}

export type WalkInSummaryRoomStatus = "none" | "selected" | "occupied";

/**
 * Walk-In summary room status label.
 * `wizardStep` is reserved for step-aware occupancy hints (not yet implemented).
 */
export function resolveWalkInSummaryRoomStatus(
  roomNumber: string,
  wizardStep: number
): { key: WalkInSummaryRoomStatus; label: string } {
  void wizardStep;
  if (!roomNumber) {
    return { key: "none", label: "—" };
  }

  return { key: "selected", label: "Selected" };
}
