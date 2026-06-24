import { roundCurrency } from "@/lib/payments/currency";
import type { DbPaymentStatus, DbPaymentTransaction } from "@/types/database";

export type PaymentTotals = {
  totalPaid: number;
  totalRefunded: number;
  netPaid: number;
  maxRefundable: number;
};

export function computeTransactionTotals(
  transactions: Pick<DbPaymentTransaction, "amount">[]
): PaymentTotals {
  let totalPaid = 0;
  let totalRefunded = 0;

  for (const tx of transactions) {
    const amount = roundCurrency(Number(tx.amount));
    if (amount > 0) totalPaid = roundCurrency(totalPaid + amount);
    else if (amount < 0) totalRefunded = roundCurrency(totalRefunded + Math.abs(amount));
  }

  const netPaid = roundCurrency(totalPaid - totalRefunded);

  return {
    totalPaid,
    totalRefunded,
    netPaid,
    maxRefundable: roundCurrency(Math.max(0, totalPaid - totalRefunded)),
  };
}

export function resolvePaymentStatusFromTotals(
  totalDue: number,
  totals: PaymentTotals
): DbPaymentStatus {
  const due = roundCurrency(totalDue);
  const { totalPaid, totalRefunded, netPaid } = totals;
  const balance = roundCurrency(due - netPaid);

  if (totalRefunded > 0 && totalRefunded >= totalPaid && totalPaid > 0) {
    return "refunded";
  }

  if (totalRefunded > 0) {
    if (balance > 0) return "partially_refunded";
    return "partially_refunded";
  }

  if (balance <= 0 && netPaid > 0) return "paid";
  if (netPaid > 0) return "partial";
  return "pending";
}

export function buildRefundDescription(
  reason: string,
  notes?: string
): string {
  const trimmedReason = reason.trim();
  const trimmedNotes = notes?.trim();
  if (trimmedNotes) {
    return `Refund: ${trimmedReason} — ${trimmedNotes}`;
  }
  return `Refund: ${trimmedReason}`;
}

export function parseRefundReason(description: string): string | undefined {
  if (!description.startsWith("Refund: ")) return undefined;
  const rest = description.slice("Refund: ".length);
  const separator = rest.indexOf(" — ");
  return separator >= 0 ? rest.slice(0, separator) : rest;
}
