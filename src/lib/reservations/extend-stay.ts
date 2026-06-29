import { computeStayPricing } from "@/lib/reservations/pricing";
import { roundCurrency } from "@/lib/payments/currency";
import { nightsBetween } from "@/lib/utils";

export function canExtendStay(
  status: string,
  currentCheckOutDate: string,
  newCheckOutDate: string
): boolean {
  return status === "checked_in" && newCheckOutDate > currentCheckOutDate;
}

export function computeStayExtension(params: {
  checkInDate: string;
  currentCheckOutDate: string;
  newCheckOutDate: string;
  roomRate: number;
  currentTotalAmount: number;
  amountPaid: number;
  taxRate: number;
  serviceChargeRate: number;
}) {
  const currentNights = nightsBetween(params.checkInDate, params.currentCheckOutDate);
  const newNights = nightsBetween(params.checkInDate, params.newCheckOutDate);
  const extraNights = Math.max(0, newNights - currentNights);

  const currentPricing = computeStayPricing({
    roomRate: params.roomRate,
    checkIn: params.checkInDate,
    checkOut: params.currentCheckOutDate,
    taxRate: params.taxRate,
    serviceChargeRate: params.serviceChargeRate,
  });

  const newPricing = computeStayPricing({
    roomRate: params.roomRate,
    checkIn: params.checkInDate,
    checkOut: params.newCheckOutDate,
    taxRate: params.taxRate,
    serviceChargeRate: params.serviceChargeRate,
  });

  const extraAmount = roundCurrency(
    Math.max(0, newPricing.totalAmount - params.currentTotalAmount)
  );
  const paymentRequired = roundCurrency(
    Math.max(0, newPricing.totalAmount - params.amountPaid)
  );

  return {
    currentNights,
    newNights,
    extraNights,
    newSubtotal: newPricing.subtotal,
    newTaxes: newPricing.taxes,
    newTotal: newPricing.totalAmount,
    extraAmount,
    paymentRequired,
    newBalance: paymentRequired,
    newServiceCharge: newPricing.serviceCharge,
    currentPricing,
  };
}
