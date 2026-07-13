import { formatCurrency } from "@/lib/utils";
import type { PosSale } from "@/types/pos";

export type PosSaleCompletionToast = {
  headline: string;
  details: string[];
};

export function buildPosSaleCompletionToast(sale: PosSale): PosSaleCompletionToast {
  const receiptNumber =
    sale.payments[0]?.receiptNumber ?? sale.saleNumber;

  if (sale.customerType === "room_charge") {
    const details = [
      `Charged to Room ${sale.roomNumber ?? "—"}`,
      `Guest: ${sale.guestName ?? "—"}`,
      `Amount: ${formatCurrency(sale.total)}`,
      `Receipt: ${receiptNumber}`,
    ];
    return {
      headline: "Sale completed successfully",
      details,
    };
  }

  return {
    headline: "Sale completed successfully",
    details: [
      "Walk-In Customer",
      `Amount: ${formatCurrency(sale.total)}`,
      `Receipt: ${receiptNumber}`,
    ],
  };
}

export const POS_SALE_TOAST_DURATION_MS = 2500;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
