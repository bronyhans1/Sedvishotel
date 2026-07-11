import { roundCurrency } from "@/lib/payments/currency";
import { resolvePaymentStatusFromTotals } from "@/lib/payments/totals";
import type { PaymentStatus } from "@/types/payment";
import type { Reservation } from "@/types/reservation";

/** Accommodation and ancillary charges before VAT. */
export function getReservationChargeBase(reservation: Reservation): number {
  const subtotal = roundCurrency(reservation.subtotal);
  const lateFee = roundCurrency(reservation.lateCheckOutFee ?? 0);
  return roundCurrency(subtotal + lateFee);
}

/** VAT = base × rate (tax-exclusive model). */
export function computeVatOnBase(chargeBase: number, vatRate: number): number {
  if (chargeBase <= 0 || vatRate <= 0) return 0;
  return roundCurrency(chargeBase * vatRate);
}

/** Total due = base + VAT when VAT applies. */
export function computeInvoiceTotal(
  chargeBase: number,
  vatApplied: boolean,
  vatRate: number
): number {
  const base = roundCurrency(Math.max(0, chargeBase));
  if (!vatApplied || vatRate <= 0) return base;
  return roundCurrency(base + computeVatOnBase(base, vatRate));
}

/** VAT portion of a payment against an invoice total. */
export function computeVatOnPaymentAmount(
  paymentAmount: number,
  invoiceTotal: number,
  invoiceVat: number,
  vatApplied: boolean
): { vatAmount: number; baseAmount: number } {
  const amount = roundCurrency(paymentAmount);
  if (amount <= 0) return { vatAmount: 0, baseAmount: 0 };
  if (!vatApplied || invoiceVat <= 0 || invoiceTotal <= 0) {
    return { vatAmount: 0, baseAmount: amount };
  }
  const ratio = amount / invoiceTotal;
  const vatAmount = roundCurrency(invoiceVat * ratio);
  return {
    vatAmount,
    baseAmount: roundCurrency(amount - vatAmount),
  };
}

export type PaymentSettlementSource = {
  reservationNumber?: string;
  guestName?: string;
  roomNumber?: string;
  roomCategory?: string;
  chargeBase: number;
  discount?: number;
  vatRate: number;
  vatApplied: boolean;
  amountPaid: number;
  paymentAmount: number;
  /** When true, paymentAmount is never auto-filled to outstanding balance (booking wizards). */
  suppressPaymentProjection?: boolean;
  /** When set (existing payment ledger), locks total due for partial continuations. */
  lockedTotalDue?: number | null;
};

export type PaymentSettlement = {
  reservationNumber: string;
  guestName: string;
  roomNumber: string;
  roomCategory: string;
  accommodationCharge: number;
  discount: number;
  vatRate: number;
  vatApplied: boolean;
  vatAmount: number;
  totalDue: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentAmount: number;
  remainingAfterPayment: number;
  paymentStatus: PaymentStatus;
  projectedStatus: PaymentStatus;
};

function resolveDisplayStatus(
  totalDue: number,
  netPaid: number
): PaymentStatus {
  return resolvePaymentStatusFromTotals(totalDue, {
    totalPaid: Math.max(0, netPaid),
    totalRefunded: 0,
    netPaid,
    maxRefundable: Math.max(0, netPaid),
  });
}

export function buildPaymentSettlement(
  source: PaymentSettlementSource
): PaymentSettlement {
  const discount = roundCurrency(source.discount ?? 0);
  const accommodationCharge = roundCurrency(
    Math.max(0, source.chargeBase - discount)
  );
  const invoiceVat = source.vatApplied
    ? computeVatOnBase(accommodationCharge, source.vatRate)
    : 0;
  const computedTotal = roundCurrency(accommodationCharge + invoiceVat);
  const totalDue =
    source.lockedTotalDue != null
      ? roundCurrency(source.lockedTotalDue)
      : computedTotal;

  const amountPaid = roundCurrency(source.amountPaid);
  const outstandingBalance = roundCurrency(
    Math.max(0, totalDue - amountPaid)
  );
  const paymentAmount = roundCurrency(
    source.suppressPaymentProjection
      ? Math.max(0, source.paymentAmount)
      : source.paymentAmount > 0
        ? source.paymentAmount
        : outstandingBalance
  );
  const projectedNetPaid = roundCurrency(amountPaid + paymentAmount);
  const remainingAfterPayment = roundCurrency(
    Math.max(0, totalDue - projectedNetPaid)
  );

  return {
    reservationNumber: source.reservationNumber ?? "",
    guestName: source.guestName ?? "",
    roomNumber: source.roomNumber ?? "",
    roomCategory: source.roomCategory ?? "",
    accommodationCharge,
    discount,
    vatRate: source.vatRate,
    vatApplied: source.vatApplied,
    vatAmount: invoiceVat,
    totalDue,
    amountPaid,
    outstandingBalance,
    paymentAmount,
    remainingAfterPayment,
    paymentStatus: resolveDisplayStatus(totalDue, amountPaid),
    projectedStatus: resolveDisplayStatus(totalDue, projectedNetPaid),
  };
}

export function buildSettlementFromReservation(
  reservation: Reservation,
  vatRate: number,
  vatApplied: boolean,
  paymentAmount: number,
  options?: {
    lockedTotalDue?: number | null;
    discount?: number;
    amountPaid?: number;
    suppressPaymentProjection?: boolean;
  }
): PaymentSettlement {
  return buildPaymentSettlement({
    reservationNumber: reservation.reservationNumber,
    guestName: reservation.guestName,
    roomNumber: reservation.roomNumber,
    roomCategory: reservation.roomTypeName,
    chargeBase: getReservationChargeBase(reservation),
    discount: options?.discount,
    vatRate,
    vatApplied,
    amountPaid: options?.amountPaid ?? reservation.amountPaid,
    paymentAmount,
    lockedTotalDue: options?.lockedTotalDue,
    suppressPaymentProjection: options?.suppressPaymentProjection,
  });
}
