import {
  buildFolioSummary,
  calculateFolioBalance,
  type FolioSettlementEntry,
} from "@/lib/folio/balance";
import type { DbFolioEntry } from "@/types/database";

/**
 * Master folio balance rolls up entries from the master folio and all child folios.
 * Uses existing folio entry math — no duplicated totals logic.
 */
export function computeMasterFolioBalance(
  masterEntries: FolioSettlementEntry[],
  childEntriesList: FolioSettlementEntry[][]
): {
  totalCharges: number;
  totalPayments: number;
  outstandingBalance: number;
  vat: number;
} {
  const allEntries: FolioSettlementEntry[] = [
    ...masterEntries,
    ...childEntriesList.flat(),
  ];
  const summary = buildFolioSummary(allEntries);
  return {
    totalCharges: calculateFolioBalance(
      allEntries.filter((e) => e.debitCredit === "debit")
    ),
    totalPayments: summary.payments,
    outstandingBalance: summary.outstandingBalance,
    vat: summary.vat,
  };
}

export function mapDbFolioEntriesToSettlement(
  entries: DbFolioEntry[]
): FolioSettlementEntry[] {
  return entries.map((entry) => ({
    entryType: entry.entry_type,
    debitCredit: entry.debit_credit,
    total: Number(entry.total),
    vatAmount: Number(entry.vat_amount),
  }));
}
