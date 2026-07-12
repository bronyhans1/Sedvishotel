import { computeStayPricing } from "@/lib/reservations/pricing";
import { roundCurrency } from "@/lib/payments/currency";
import { nightsBetween } from "@/lib/utils";

export type EarlyCheckoutComputation = {
  originalNights: number;
  actualNights: number;
  unusedNights: number;
  refundAmount: number;
  actualSubtotal: number;
  actualTaxes: number;
  actualServiceCharge: number;
  actualTotal: number;
  actualBalance: number;
};

export function canEarlyCheckOut(
  status: string,
  checkInDate: string,
  scheduledCheckOutDate: string,
  asOfDate: string
): boolean {
  return (
    status === "checked_in" &&
    asOfDate >= checkInDate &&
    asOfDate < scheduledCheckOutDate
  );
}

export function computeEarlyCheckout(params: {
  checkInDate: string;
  scheduledCheckOutDate: string;
  actualCheckOutDate: string;
  originalNights: number;
  totalAmount: number;
  roomRate: number;
  amountPaid: number;
  taxRate: number;
  serviceChargeRate: number;
}): EarlyCheckoutComputation {
  const { checkInDate, scheduledCheckOutDate, actualCheckOutDate } = params;

  if (actualCheckOutDate >= scheduledCheckOutDate) {
    throw new Error("Actual checkout must be before the scheduled checkout date.");
  }
  if (actualCheckOutDate < checkInDate) {
    throw new Error("Actual checkout must be on or after check-in.");
  }

  const originalNights = params.originalNights;
  const actualNights = nightsBetween(checkInDate, actualCheckOutDate);
  const unusedNights = Math.max(0, originalNights - actualNights);

  const actualPricing = computeStayPricing({
    roomRate: params.roomRate,
    checkIn: checkInDate,
    checkOut: actualCheckOutDate,
    taxRate: params.taxRate,
    serviceChargeRate: params.serviceChargeRate,
  });

  const proportionalRefund =
    originalNights > 0
      ? roundCurrency((unusedNights / originalNights) * params.totalAmount)
      : 0;
  const overpaymentRefund = roundCurrency(
    Math.max(0, roundCurrency(params.amountPaid) - actualPricing.totalAmount)
  );
  const refundAmount = roundCurrency(
    Math.min(proportionalRefund, overpaymentRefund)
  );

  const actualBalance = roundCurrency(
    Math.max(0, actualPricing.totalAmount - roundCurrency(params.amountPaid))
  );

  return {
    originalNights,
    actualNights,
    unusedNights,
    refundAmount,
    actualSubtotal: actualPricing.subtotal,
    actualTaxes: actualPricing.taxes,
    actualServiceCharge: actualPricing.serviceCharge,
    actualTotal: actualPricing.totalAmount,
    actualBalance,
  };
}
