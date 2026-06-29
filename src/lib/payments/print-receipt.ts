import { PAYMENT_METHOD_LABELS } from "@/lib/analytics/payment-labels";
import { formatCurrency } from "@/lib/utils";
import type { Payment, PaymentTimelineEntry } from "@/types/payment";

function formatDisplayDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function receiptBaseAmount(entry: PaymentTimelineEntry): number {
  if (entry.vatApplied === false) return entry.amount;
  const vat = entry.vatAmount ?? 0;
  return Math.max(0, entry.amount - vat);
}

export function printTransactionReceipt(
  payment: Payment,
  entry: PaymentTimelineEntry,
  branding?: { hotelName?: string; logoUrl?: string | null; primaryColor?: string }
): void {
  if (!entry.receiptNumber) return;

  const hotelName = branding?.hotelName ?? "SEDVIS HOTEL";
  const accent = branding?.primaryColor ?? "#1e3a5f";
  const logoBlock = branding?.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${hotelName}" style="height:48px;object-fit:contain" />`
    : `<div style="width:48px;height:48px;border-radius:8px;background:${accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${hotelName.charAt(0)}</div>`;

  const accommodation = receiptBaseAmount(entry);
  const vatLine =
    entry.vatApplied === false
      ? "Exempt"
      : entry.vatAmount && entry.vatAmount > 0
        ? formatCurrency(entry.vatAmount)
        : formatCurrency(0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${entry.receiptNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 480px; margin: 0 auto; }
    .header { display:flex; gap:12px; align-items:center; border-bottom:1px solid #ddd; padding-bottom:16px; margin-bottom:16px; }
    h1 { font-size: 1.25rem; margin: 0; color: ${accent}; }
    .muted { color: #666; font-size: 0.875rem; }
    dl { margin-top: 1.5rem; }
    dt { color: #666; font-size: 0.75rem; text-transform: uppercase; margin-top: 0.75rem; }
    dd { margin: 0.25rem 0 0; font-size: 1rem; font-weight: 600; }
    .amount { font-size: 1.5rem; margin-top: 1rem; color: ${accent}; }
    .totals { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">${logoBlock}<div><h1>${hotelName}</h1><p class="muted">Transaction Receipt</p></div></div>
  <p class="muted">${entry.receiptNumber}</p>
  <dl>
    <dt>Payment Reference</dt><dd>${payment.reference}</dd>
    <dt>Guest</dt><dd>${payment.guestName}</dd>
    <dt>Reservation</dt><dd>${payment.reservationNumber}</dd>
    <dt>Date</dt><dd>${formatDisplayDate(entry.date)}</dd>
    <dt>Time</dt><dd>${entry.time}</dd>
    <dt>Method</dt><dd>${PAYMENT_METHOD_LABELS[entry.method]}</dd>
  </dl>
  <div class="totals">
    <dl>
      <dt>Accommodation</dt><dd>${formatCurrency(accommodation)}</dd>
      <dt>VAT</dt><dd>${vatLine}</dd>
      <dt>Total</dt><dd class="amount">${formatCurrency(entry.amount)}</dd>
    </dl>
  </div>
  ${
    entry.description && entry.description !== "Payment recorded"
      ? `<dl><dt>Notes</dt><dd>${entry.description}</dd></dl>`
      : ""
  }
</body>
</html>`;

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
