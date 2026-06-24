import type { Invoice, InvoiceStats } from "@/types/invoice";

export function computeInvoiceStats(invoices: Invoice[]): InvoiceStats {
  const paid = invoices.filter((i) => i.status === "paid");
  const outstanding = invoices.filter(
    (i) => i.status === "outstanding" || i.status === "partial"
  );
  const averageValue =
    invoices.length > 0
      ? Math.round(
          invoices.reduce((sum, i) => sum + i.totalAmount, 0) / invoices.length
        )
      : 0;

  return {
    generated: invoices.length,
    paid: paid.length,
    outstanding: outstanding.length,
    averageValue,
  };
}
