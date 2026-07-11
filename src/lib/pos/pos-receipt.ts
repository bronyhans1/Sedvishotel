import { formatCurrency } from "@/lib/utils";
import {
  buildReceiptHeaderBlock,
  buildReceiptPrintBadge,
  escapeReceiptHtml,
  formatReceiptDateTime,
  openReceiptPrintWindow,
  printReceiptHtml,
  RECEIPT_BASE_STYLES,
  renderReceiptInWindow,
  type ReceiptBranding,
} from "@/lib/receipt/receipt-core";
import {
  POS_CUSTOMER_TYPE_OPTIONS,
  POS_PAYMENT_METHOD_OPTIONS,
} from "@/types/pos";
import type { PosSale } from "@/types/pos";

export type PosReceiptBranding = ReceiptBranding;

function paymentMethodLabel(
  method: PosSale["payments"][number]["paymentMethod"]
): string {
  return (
    POS_PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)
      ?.label ?? method.replace(/_/g, " ")
  );
}

function customerTypeLabel(customerType: PosSale["customerType"]): string {
  return (
    POS_CUSTOMER_TYPE_OPTIONS.find((option) => option.value === customerType)
      ?.label ?? customerType.replace(/_/g, " ")
  );
}

export function buildPosReceiptDocumentHtml(
  sale: PosSale,
  branding?: ReceiptBranding,
  printCount = 1
): string {
  const receiptNumber =
    sale.payments[0]?.receiptNumber ?? sale.saleNumber;
  const accent = branding?.primaryColor ?? "#1e3a5f";
  const payment = sale.payments[0];
  const methodLabel = payment
    ? paymentMethodLabel(payment.paymentMethod)
    : sale.customerType === "room_charge"
      ? "Charge To Room"
      : "—";
  const amountPaid =
    sale.customerType === "room_charge" && sale.paymentStatus === "pending"
      ? 0
      : payment?.amount ?? sale.total;
  const balance =
    sale.customerType === "room_charge" && sale.paymentStatus === "pending"
      ? sale.total
      : 0;

  const itemRows = sale.items
    .map(
      (item) => `
      <tr>
        <td>${escapeReceiptHtml(item.productName)}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatCurrency(item.unitPrice)}</td>
        <td style="text-align:right">${formatCurrency(item.total)}</td>
      </tr>`
    )
    .join("");

  const roomGuestBlock =
    sale.customerType === "room_charge"
      ? `<p><strong>Guest:</strong> ${escapeReceiptHtml(sale.guestName ?? "—")}</p>
         <p><strong>Room:</strong> ${escapeReceiptHtml(sale.roomNumber ?? "—")} · ${escapeReceiptHtml(sale.reservationNumber ?? "—")}</p>`
      : "";

  const footerBlock = [
    branding?.footerMessage
      ? `<p class="muted">${escapeReceiptHtml(branding.footerMessage)}</p>`
      : "",
    branding?.thankYouMessage
      ? `<p class="footer">${escapeReceiptHtml(branding.thankYouMessage)}</p>`
      : `<p class="footer">Thank you for your purchase!</p>`,
  ]
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeReceiptHtml(receiptNumber)}</title>
  <style>
    ${RECEIPT_BASE_STYLES}
    h2 { color: ${accent}; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { padding: 4px 0; vertical-align: top; }
    th { text-align: left; font-size: 0.7rem; text-transform: uppercase; color: #666; border-bottom: 1px solid #ddd; }
    .total { font-size: 1.2rem; font-weight: 700; color: ${accent}; margin-top: 8px; }
  </style>
</head>
<body>
  ${buildReceiptHeaderBlock(branding, "Retail Receipt")}
  ${buildReceiptPrintBadge(printCount)}
  <h2>POS Receipt</h2>
  <div class="meta">
    <p><strong>Receipt Number:</strong> ${escapeReceiptHtml(receiptNumber)}</p>
    <p><strong>Sale Number:</strong> ${escapeReceiptHtml(sale.saleNumber)}</p>
    <p><strong>Date &amp; Time:</strong> ${formatReceiptDateTime(sale.createdAt)}</p>
    <p><strong>Cashier:</strong> ${escapeReceiptHtml(sale.cashierName ?? "—")}</p>
    <p><strong>Customer Type:</strong> ${escapeReceiptHtml(customerTypeLabel(sale.customerType))}</p>
    ${roomGuestBlock}
  </div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Line Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="divider"></div>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatCurrency(sale.subtotal)}</span></div>
    ${
      sale.discount > 0
        ? `<div><span>Discount</span><span>-${formatCurrency(sale.discount)}</span></div>`
        : ""
    }
    <div><span>VAT</span><span>${formatCurrency(sale.vatAmount)}</span></div>
    <div class="total"><span>Total</span><span>${formatCurrency(sale.total)}</span></div>
    <div><span>Payment Method</span><span>${escapeReceiptHtml(methodLabel)}</span></div>
    <div><span>Amount Paid</span><span>${formatCurrency(amountPaid)}</span></div>
    ${
      balance > 0
        ? `<div><span>Balance</span><span>${formatCurrency(balance)}</span></div>`
        : ""
    }
  </div>
  ${footerBlock}
</body>
</html>`;
}

export function openPosReceiptPrintWindow(): Window | null {
  return openReceiptPrintWindow();
}

export function renderPosReceiptInWindow(
  printWindow: Window | null,
  sale: PosSale,
  branding?: ReceiptBranding,
  printCount = 1
): void {
  renderReceiptInWindow(
    printWindow,
    buildPosReceiptDocumentHtml(sale, branding, printCount)
  );
}

export function printPosReceipt(
  sale: PosSale,
  branding?: ReceiptBranding,
  printCount = 1
): void {
  printReceiptHtml(buildPosReceiptDocumentHtml(sale, branding, printCount));
}
