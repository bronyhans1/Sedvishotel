import { TAX_RATE } from "@/lib/reservations/constants";
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
}) {
  const currentNights = nightsBetween(params.checkInDate, params.currentCheckOutDate);
  const newNights = nightsBetween(params.checkInDate, params.newCheckOutDate);
  const extraNights = Math.max(0, newNights - currentNights);

  const newSubtotal = roundCurrency(params.roomRate * newNights);
  const newTaxes = roundCurrency(newSubtotal * TAX_RATE);
  const newTotal = roundCurrency(newSubtotal + newTaxes);
  const extraAmount = roundCurrency(Math.max(0, newTotal - params.currentTotalAmount));
  const paymentRequired = roundCurrency(Math.max(0, newTotal - params.amountPaid));

  return {
    currentNights,
    newNights,
    extraNights,
    newSubtotal,
    newTaxes,
    newTotal,
    extraAmount,
    paymentRequired,
    newBalance: paymentRequired,
  };
}
