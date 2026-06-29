import { calculateFolioBalance } from "@/lib/folio/balance";
import { mapDbFolioEntryToFolioEntry } from "@/lib/folio/mapper";
import { roundCurrency } from "@/lib/payments/currency";
import type { DbFolioEntry, DbGuestFolioWithRelations } from "@/types/database";

export type FolioNightAuditTotals = {
  folioAccommodationRevenue: number;
  folioRetailRevenue: number;
  folioMiscCharges: number;
  folioCreditsTotal: number;
  folioPaymentsTotal: number;
  folioVatTotal: number;
  folioOutstandingBalance: number;
};

export function aggregateFolioEntriesForDate(
  entries: DbFolioEntry[]
): Omit<FolioNightAuditTotals, "folioOutstandingBalance"> {
  let folioAccommodationRevenue = 0;
  let folioRetailRevenue = 0;
  let folioMiscCharges = 0;
  let folioCreditsTotal = 0;
  let folioPaymentsTotal = 0;
  let folioVatTotal = 0;

  for (const entry of entries) {
    const total = roundCurrency(Number(entry.total));
    const vat = roundCurrency(Number(entry.vat_amount));

    if (entry.debit_credit === "debit") {
      folioVatTotal = roundCurrency(folioVatTotal + vat);
      switch (entry.entry_type) {
        case "accommodation":
          folioAccommodationRevenue = roundCurrency(folioAccommodationRevenue + total);
          break;
        case "retail_pos":
          folioRetailRevenue = roundCurrency(folioRetailRevenue + total);
          break;
        case "misc_charge":
        case "manual_charge":
          folioMiscCharges = roundCurrency(folioMiscCharges + total);
          break;
        default:
          break;
      }
    } else {
      if (entry.entry_type === "payment") {
        folioPaymentsTotal = roundCurrency(folioPaymentsTotal + total);
      } else {
        folioCreditsTotal = roundCurrency(folioCreditsTotal + total);
      }
    }
  }

  return {
    folioAccommodationRevenue,
    folioRetailRevenue,
    folioMiscCharges,
    folioCreditsTotal,
    folioPaymentsTotal,
    folioVatTotal,
  };
}

export function sumOpenFolioOutstanding(
  openFolios: DbGuestFolioWithRelations[]
): number {
  let total = 0;
  for (const folio of openFolios) {
    const entries = (folio.entries ?? []).map(mapDbFolioEntryToFolioEntry);
    total = roundCurrency(total + calculateFolioBalance(entries));
  }
  return total;
}
