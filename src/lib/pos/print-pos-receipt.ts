import { formatCurrency } from "@/lib/utils";
import { POS_PAYMENT_METHOD_OPTIONS } from "@/types/pos";
import type { PosSale } from "@/types/pos";

function paymentMethodLabel(method: PosSale["payments"][number]["paymentMethod"]): string {
  return (
    POS_PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
    method.replace(/_/g, " ")
  );
}

function formatDisplayDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type PosReceiptBranding = {
  hotelName?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  thankYouMessage?: string;
};

export function printPosReceipt(
  sale: PosSale,
  branding?: PosReceiptBranding
): void {
  const receiptNumber =
    sale.payments[0]?.receiptNumber ?? sale.saleNumber;
  const hotelName = branding?.hotelName ?? "SEDVIS HOTEL";
  const accent = branding?.primaryColor ?? "#1e3a5f";
  const thankYou =
    branding?.thankYouMessage ?? "Thank you for your purchase!";
  const payment = sale.payments[0];
  const methodLabel = payment ? paymentMethodLabel(payment.paymentMethod) : "—";

  const logoBlock = branding?.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${hotelName}" style="height:48px;object-fit:contain" />`
    : `<div style="width:48px;height:48px;border-radius:8px;background:${accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${hotelName.charAt(0)}</div>`;

  const itemRows = sale.items
    .map(
      (item) => `
      <tr>
        <td>${item.productName}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatCurrency(item.unitPrice)}</td>
        <td style="text-align:right">${formatCurrency(item.total)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${receiptNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 1.5rem; max-width: 420px; margin: 0 auto; font-size: 14px; }
    .header { display:flex; gap:12px; align-items:center; border-bottom:1px solid #ddd; padding-bottom:12px; margin-bottom:12px; }
    h1 { font-size: 1.1rem; margin: 0; color: ${accent}; }
    .muted { color: #666; font-size: 0.8rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 4px 0; vertical-align: top; }
    th { text-align: left; font-size: 0.7rem; text-transform: uppercase; color: #666; border-bottom: 1px solid #ddd; }
    .totals { margin-top: 12px; border-top: 1px solid #ddd; padding-top: 8px; }
    .totals div { display:flex; justify-content:space-between; margin: 4px 0; }
    .total { font-size: 1.2rem; font-weight: 700; color: ${accent}; margin-top: 8px; }
    .footer { margin-top: 16px; text-align: center; color: #666; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="header">${logoBlock}<div><h1>${hotelName}</h1><p class="muted">Retail Receipt</p></div></div>
  <p class="muted">${receiptNumber}</p>
  <p><strong>Sale:</strong> ${sale.saleNumber}</p>
  <p><strong>Cashier:</strong> ${sale.cashierName ?? "—"}</p>
  <p><strong>Date:</strong> ${formatDisplayDate(sale.createdAt)}</p>
  ${
    sale.customerType === "room_charge"
      ? `<p><strong>Guest:</strong> ${sale.guestName ?? "—"}</p>
         <p><strong>Room:</strong> ${sale.roomNumber ?? "—"} · ${sale.reservationNumber ?? "—"}</p>`
      : ""
  }
  <table>
    <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatCurrency(sale.subtotal)}</span></div>
    <div><span>VAT</span><span>${formatCurrency(sale.vatAmount)}</span></div>
    ${
      sale.discount > 0
        ? `<div><span>Discount</span><span>-${formatCurrency(sale.discount)}</span></div>`
        : ""
    }
    <div class="total"><span>Total</span><span>${formatCurrency(sale.total)}</span></div>
    <div><span>Payment</span><span>${methodLabel}</span></div>
  </div>
  <p class="footer">${thankYou}</p>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
