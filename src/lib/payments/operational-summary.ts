import { roundCurrency } from "@/lib/payments/currency";
import {
  computePaymentStats,
  type PaymentStatsSource,
} from "@/lib/payments/stats";
import { computeTransactionTotals } from "@/lib/payments/totals";
import type { PaymentStats, PaymentStatus } from "@/types/payment";

/** Lean payment header used for KPIs and the Record Payment partial-balance list. */
export type OperationalPaymentRow = {
  id: string;
  reference: string;
  reservationId: string;
  status: PaymentStatus;
  /** Stored `payment_date`, sliced to YYYY-MM-DD the same way as the payment mapper. */
  paymentDate: string;
  balanceAfter: number | string;
  totalDue: number | string;
  createdAt: string;
};

export type OperationalTransactionAmount = {
  paymentId: string;
  amount: number | string;
};

export type OperationalPartialPayment = {
  reservationId: string;
  reference: string;
  totalDue: number;
  amountPaid: number;
  outstandingBalance: number;
};

function compareNewestFirst(a: OperationalPaymentRow, b: OperationalPaymentRow): number {
  const byDate = b.paymentDate.localeCompare(a.paymentDate);
  if (byDate !== 0) return byDate;
  const byCreated = b.createdAt.localeCompare(a.createdAt);
  if (byCreated !== 0) return byCreated;
  return b.id.localeCompare(a.id);
}

/**
 * Builds the payment-page KPIs and partial-payment contexts from lean rows.
 * Formulas stay in `computePaymentStats` and `computeTransactionTotals`.
 * Search and the visible page are not inputs.
 */
export function buildOperationalPaymentSummary(
  rows: OperationalPaymentRow[],
  transactions: OperationalTransactionAmount[]
): { stats: PaymentStats; partialPayments: OperationalPartialPayment[] } {
  const amountsByPayment = new Map<string, number[]>();
  for (const transaction of transactions) {
    const list = amountsByPayment.get(transaction.paymentId) ?? [];
    list.push(Number(transaction.amount));
    amountsByPayment.set(transaction.paymentId, list);
  }

  const statsInputs: PaymentStatsSource[] = [];
  const partialPayments: OperationalPartialPayment[] = [];

  for (const row of [...rows].sort(compareNewestFirst)) {
    const amounts = amountsByPayment.get(row.id) ?? [];
    const totals = computeTransactionTotals(amounts.map((amount) => ({ amount })));
    const balance = roundCurrency(Number(row.balanceAfter));
    const paymentDate = row.paymentDate.slice(0, 10);
    const refundCount = amounts.filter((amount) => Number(amount) < 0).length;

    statsInputs.push({
      netPaid: totals.netPaid,
      paymentDate,
      balance,
      status: row.status,
      refundCount,
    });

    if (row.status === "partial" && balance > 0) {
      partialPayments.push({
        reservationId: row.reservationId,
        reference: row.reference,
        totalDue: roundCurrency(Number(row.totalDue)),
        amountPaid: roundCurrency(totals.netPaid),
        outstandingBalance: roundCurrency(balance),
      });
    }
  }

  return {
    stats: computePaymentStats(statsInputs),
    partialPayments,
  };
}
