import { roundCurrency } from "@/lib/payments/currency";
import type { AuthoritativeSettlement } from "@/lib/folio/authoritative-settlement";
import type { PaymentSettlement } from "@/lib/payments/payment-settlement";
import { resolvePaymentStatusFromTotals } from "@/lib/payments/totals";
import type { PaymentStatus } from "@/types/payment";
import type { Reservation } from "@/types/reservation";

/** Payment UI settlement when folio is the authoritative ledger (checked-in stays). */
export function buildPaymentSettlementFromFolio(
  reservation: Reservation,
  folio: AuthoritativeSettlement,
  paymentAmount: number,
  options?: { suppressPaymentProjection?: boolean }
): PaymentSettlement {
  const outstandingBalance = roundCurrency(Math.max(0, folio.outstandingBalance));
  const payment = roundCurrency(
    options?.suppressPaymentProjection
      ? Math.max(0, paymentAmount)
      : paymentAmount > 0
        ? paymentAmount
        : outstandingBalance
  );
  const projectedNetPaid = roundCurrency(folio.amountPaid + payment);
  const remainingAfterPayment = roundCurrency(
    Math.max(0, folio.totalAmount - projectedNetPaid)
  );

  const resolveStatus = (due: number, netPaid: number): PaymentStatus =>
    resolvePaymentStatusFromTotals(due, {
      totalPaid: Math.max(0, netPaid),
      totalRefunded: 0,
      netPaid,
      maxRefundable: Math.max(0, netPaid),
    });

  return {
    reservationNumber: reservation.reservationNumber,
    guestName: reservation.guestName,
    roomNumber: reservation.roomNumber,
    roomCategory: reservation.roomTypeName,
    accommodationCharge: folio.summary.accommodation,
    discount: folio.summary.discounts,
    vatRate: 0,
    vatApplied: false,
    vatAmount: folio.summary.vat,
    totalDue: folio.totalAmount,
    amountPaid: folio.amountPaid,
    outstandingBalance,
    paymentAmount: payment,
    remainingAfterPayment,
    paymentStatus: resolveStatus(folio.totalAmount, folio.amountPaid),
    projectedStatus: resolveStatus(folio.totalAmount, projectedNetPaid),
  };
}

/** Checkout settlement from folio outstanding (legacy helper — prefer buildPaymentSettlementFromFolio). */
export function buildSettlementFromFolioBalance(
  reservation: Reservation,
  folioOutstanding: number,
  paymentAmount: number
): PaymentSettlement {
  const totalDue = roundCurrency(Math.max(0, folioOutstanding));
  const amountPaid = 0;
  const outstandingBalance = totalDue;
  const payment = roundCurrency(paymentAmount > 0 ? paymentAmount : outstandingBalance);
  const remainingAfterPayment = roundCurrency(
    Math.max(0, outstandingBalance - payment)
  );
  const projectedNetPaid = payment;

  const resolveStatus = (due: number, netPaid: number): PaymentStatus =>
    resolvePaymentStatusFromTotals(due, {
      totalPaid: Math.max(0, netPaid),
      totalRefunded: 0,
      netPaid,
      maxRefundable: Math.max(0, netPaid),
    });

  return {
    reservationNumber: reservation.reservationNumber,
    guestName: reservation.guestName,
    roomNumber: reservation.roomNumber,
    roomCategory: reservation.roomTypeName,
    accommodationCharge: totalDue,
    discount: 0,
    vatRate: 0,
    vatApplied: false,
    vatAmount: 0,
    totalDue,
    amountPaid,
    outstandingBalance,
    paymentAmount: payment,
    remainingAfterPayment,
    paymentStatus: resolveStatus(totalDue, amountPaid),
    projectedStatus: resolveStatus(totalDue, projectedNetPaid),
  };
}
