import {
  computeOutstandingBalance,
  roundCurrency,
} from "@/lib/payments/currency";
import { computeTransactionTotals } from "@/lib/payments/totals";
import type { DbPayment, DbPaymentTransaction } from "@/types/database";

export type OutstandingContext = {
  totalDue: number;
  previousNetPaid: number;
  outstandingBalance: number;
  transactionAmounts: number[];
  paymentAmount: number | null;
  transactionCount: number;
  reservationAmountPaid: number;
  amountPaidSource: "transactions" | "reservation";
};

/**
 * Resolve outstanding balance for payment validation.
 * When a payment ledger exists, transaction totals are the source of truth.
 * Never combine payment.amount with transaction sums — that double-counts.
 */
export function resolveOutstandingForPayment(input: {
  reservationTotalDue: number;
  reservationAmountPaid: number;
  existingPayment: DbPayment | null;
  transactions: DbPaymentTransaction[];
}): OutstandingContext {
  const reservationAmountPaid = roundCurrency(input.reservationAmountPaid);
  const transactionAmounts = input.transactions.map((tx) =>
    roundCurrency(Number(tx.amount))
  );

  if (input.existingPayment && input.transactions.length > 0) {
    const totals = computeTransactionTotals(input.transactions);
    const totalDue = roundCurrency(Number(input.existingPayment.total_due));
    const previousNetPaid = totals.netPaid;

    return {
      totalDue,
      previousNetPaid,
      outstandingBalance: computeOutstandingBalance(totalDue, previousNetPaid),
      transactionAmounts,
      paymentAmount: roundCurrency(Number(input.existingPayment.amount)),
      transactionCount: input.transactions.length,
      reservationAmountPaid,
      amountPaidSource: "transactions",
    };
  }

  const totalDue = roundCurrency(input.reservationTotalDue);
  const previousNetPaid = reservationAmountPaid;

  return {
    totalDue,
    previousNetPaid,
    outstandingBalance: computeOutstandingBalance(totalDue, previousNetPaid),
    transactionAmounts,
    paymentAmount: input.existingPayment
      ? roundCurrency(Number(input.existingPayment.amount))
      : null,
    transactionCount: input.transactions.length,
    reservationAmountPaid,
    amountPaidSource: "reservation",
  };
}
