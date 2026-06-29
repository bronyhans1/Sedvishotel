import { roundCurrency } from "@/lib/payments/currency";
import type { FolioEntry, FolioSummary } from "@/types/folio";

export type FolioSettlementEntry = Pick<
  FolioEntry,
  "entryType" | "debitCredit" | "total" | "vatAmount"
>;

export function calculateFolioBalance(entries: FolioSettlementEntry[]): number {
  let balance = 0;
  for (const entry of entries) {
    if (entry.debitCredit === "debit") {
      balance = roundCurrency(balance + entry.total);
    } else {
      balance = roundCurrency(balance - entry.total);
    }
  }
  return balance;
}

export function buildFolioSummary(entries: FolioSettlementEntry[]): FolioSummary {
  let accommodation = 0;
  let posCharges = 0;
  let miscCharges = 0;
  let discounts = 0;
  let payments = 0;
  let vat = 0;

  for (const entry of entries) {
    vat = roundCurrency(vat + entry.vatAmount);
    if (entry.debitCredit === "credit") {
      if (entry.entryType === "payment") {
        payments = roundCurrency(payments + entry.total);
      } else if (entry.entryType === "discount") {
        discounts = roundCurrency(discounts + entry.total);
      }
      continue;
    }

    switch (entry.entryType) {
      case "accommodation":
        accommodation = roundCurrency(accommodation + entry.total);
        break;
      case "retail_pos":
        posCharges = roundCurrency(posCharges + entry.total);
        break;
      case "manual_charge":
      case "misc_charge":
      case "adjustment":
        miscCharges = roundCurrency(miscCharges + entry.total);
        break;
      default:
        miscCharges = roundCurrency(miscCharges + entry.total);
        break;
    }
  }

  return {
    accommodation,
    posCharges,
    miscCharges,
    discounts,
    payments,
    vat,
    outstandingBalance: calculateFolioBalance(entries),
  };
}

export function attachRunningBalances(entries: FolioEntry[]): FolioEntry[] {
  const chronological = [...entries].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
  let running = 0;
  const withBalance = chronological.map((entry) => {
    if (entry.debitCredit === "debit") {
      running = roundCurrency(running + entry.total);
    } else {
      running = roundCurrency(running - entry.total);
    }
    return { ...entry, runningBalance: running };
  });
  return withBalance.reverse();
}

export function formatFolioSourceLabel(sourceModule: string): string {
  const labels: Record<string, string> = {
    guest_folio: "Guest Folio",
    pos: "POS",
    payments: "Payments",
    reservations: "Reservations",
    restaurant: "Restaurant",
    laundry: "Laundry",
    spa: "Spa",
  };
  return labels[sourceModule] ?? sourceModule.replace(/_/g, " ");
}
