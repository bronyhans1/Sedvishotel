import { buildPaymentSettlement } from "@/lib/payments/payment-settlement";
import type { PaymentSettlement } from "@/lib/payments/payment-settlement";
import type { buildReservationPricingSnapshot } from "@/lib/reservations/rate-management";

export type WalkInPricingSnapshot = ReturnType<
  typeof buildReservationPricingSnapshot
>;

const EMPTY_SETTLEMENT: PaymentSettlement = {
  reservationNumber: "",
  guestName: "",
  roomNumber: "",
  roomCategory: "",
  accommodationCharge: 0,
  discount: 0,
  vatRate: 0,
  vatApplied: true,
  vatAmount: 0,
  totalDue: 0,
  amountPaid: 0,
  outstandingBalance: 0,
  paymentAmount: 0,
  remainingAfterPayment: 0,
  paymentStatus: "pending",
  projectedStatus: "pending",
};

/**
 * Builds payment settlement from the walk-in wizard pricing snapshot.
 * Mirrors WalkInService.completeWalkIn charge path — never use rack rate directly.
 */
export function buildWalkInPaymentSettlement(input: {
  pricingSnapshot: WalkInPricingSnapshot | null;
  additionalDiscount?: number;
  guestName?: string;
  roomNumber?: string;
  roomCategory?: string;
  vatRate: number;
  vatApplied: boolean;
  amountPaid?: number;
  paymentAmount?: number;
  suppressPaymentProjection?: boolean;
}): PaymentSettlement {
  if (!input.pricingSnapshot) return EMPTY_SETTLEMENT;

  return buildPaymentSettlement({
    guestName: input.guestName,
    roomNumber: input.roomNumber,
    roomCategory: input.roomCategory,
    chargeBase: input.pricingSnapshot.subtotal,
    discount: input.additionalDiscount ?? 0,
    vatRate: input.vatRate,
    vatApplied: input.vatApplied,
    amountPaid: input.amountPaid ?? 0,
    paymentAmount: input.paymentAmount ?? 0,
    suppressPaymentProjection: input.suppressPaymentProjection,
  });
}
