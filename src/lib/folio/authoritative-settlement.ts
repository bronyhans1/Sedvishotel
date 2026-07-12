import { roundCurrency } from "@/lib/payments/currency";
import { buildFolioSummary, calculateFolioBalance } from "@/lib/folio/balance";
import type { FolioSettlementEntry } from "@/lib/folio/balance";
import type { DbReservationStatus } from "@/types/database";

/** Folio is authoritative for financial settlement once the guest is in-house. */
export function isFolioAuthoritative(status: DbReservationStatus): boolean {
  return status === "checked_in";
}

export type AuthoritativeSettlement = {
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  summary: ReturnType<typeof buildFolioSummary>;
};

export function deriveAuthoritativeSettlement(
  entries: FolioSettlementEntry[]
): AuthoritativeSettlement {
  const outstandingBalance = calculateFolioBalance(entries);
  const summary = buildFolioSummary(entries);

  let totalDebits = 0;
  let totalCredits = 0;
  for (const entry of entries) {
    if (entry.debitCredit === "debit") {
      if (entry.entryType !== "refund") {
        totalDebits = roundCurrency(totalDebits + entry.total);
      }
    } else if (entry.entryType === "payment") {
      totalCredits = roundCurrency(totalCredits + entry.total);
    }
  }

  return {
    totalAmount: totalDebits,
    amountPaid: totalCredits,
    outstandingBalance,
    summary,
  };
}

export function resolveInvoiceStatusFromSettlement(
  totalAmount: number,
  amountPaid: number,
  outstandingBalance: number
): "paid" | "partial" | "outstanding" {
  if (outstandingBalance <= 0 && totalAmount > 0) return "paid";
  if (amountPaid > 0) return "partial";
  return "outstanding";
}

export function resolvePaymentStatusFromSettlement(
  totalAmount: number,
  outstandingBalance: number
): "paid" | "partial" | "pending" {
  if (outstandingBalance <= 0 && totalAmount > 0) return "paid";
  if (outstandingBalance < totalAmount) return "partial";
  return "pending";
}
