import { formatCurrency } from "@/lib/utils";
import {
  POS_CUSTOMER_TYPE_OPTIONS,
  POS_PAYMENT_METHOD_OPTIONS,
} from "@/types/pos";
import type { PosSale } from "@/types/pos";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
  address?: string;
  phone?: string;
  thankYouMessage?: string;
};

export function buildPosReceiptDocumentHtml(
  sale: PosSale,
  branding?: PosReceiptBranding
): string {
  const receiptNumber =
    sale.payments[0]?.receiptNumber ?? sale.saleNumber;
  const hotelName = escapeHtml(branding?.hotelName ?? "SEDVIS HOTEL");
  const accent = branding?.primaryColor ?? "#1e3a5f";
  const thankYou = escapeHtml(
    branding?.thankYouMessage ?? "Thank you for your purchase!"
  );
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

  const logoBlock = branding?.logoUrl
    ? `<img src="${escapeHtml(branding.logoUrl)}" alt="${hotelName}" style="height:48px;object-fit:contain" />`
    : `<div style="width:48px;height:48px;border-radius:8px;background:${accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${hotelName.charAt(0)}</div>`;

  const contactLines = [
    branding?.address ? `<p class="muted">${escapeHtml(branding.address)}</p>` : "",
    branding?.phone ? `<p class="muted">${escapeHtml(branding.phone)}</p>` : "",
  ]
    .filter(Boolean)
    .join("");

  const itemRows = sale.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.productName)}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatCurrency(item.unitPrice)}</td>
        <td style="text-align:right">${formatCurrency(item.total)}</td>
      </tr>`
    )
    .join("");

  const roomGuestBlock =
    sale.customerType === "room_charge"
      ? `<p><strong>Guest:</strong> ${escapeHtml(sale.guestName ?? "—")}</p>
         <p><strong>Room:</strong> ${escapeHtml(sale.roomNumber ?? "—")} · ${escapeHtml(sale.reservationNumber ?? "—")}</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(receiptNumber)}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0.75rem; }
    }
    body { font-family: system-ui, sans-serif; padding: 1.5rem; max-width: 420px; margin: 0 auto; font-size: 14px; color: #111; }
    .header { display:flex; gap:12px; align-items:center; border-bottom:1px solid #ddd; padding-bottom:12px; margin-bottom:12px; }
    h1 { font-size: 1.1rem; margin: 0; color: ${accent}; }
    h2 { font-size: 0.95rem; margin: 0 0 8px; color: ${accent}; }
    .muted { color: #666; font-size: 0.8rem; margin: 2px 0; }
    .meta { margin: 8px 0 12px; }
    .meta p { margin: 4px 0; }
    .divider { border-top: 1px dashed #ccc; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { padding: 4px 0; vertical-align: top; }
    th { text-align: left; font-size: 0.7rem; text-transform: uppercase; color: #666; border-bottom: 1px solid #ddd; }
    .totals { margin-top: 12px; border-top: 1px solid #ddd; padding-top: 8px; }
    .totals div { display:flex; justify-content:space-between; margin: 4px 0; }
    .total { font-size: 1.2rem; font-weight: 700; color: ${accent}; margin-top: 8px; }
    .footer { margin-top: 16px; text-align: center; color: #666; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="header">
    ${logoBlock}
    <div>
      <h1>${hotelName}</h1>
      ${contactLines}
    </div>
  </div>
  <h2>Retail Receipt</h2>
  <div class="meta">
    <p><strong>Receipt Number:</strong> ${escapeHtml(receiptNumber)}</p>
    <p><strong>Sale Number:</strong> ${escapeHtml(sale.saleNumber)}</p>
    <p><strong>Date &amp; Time:</strong> ${formatDisplayDate(sale.createdAt)}</p>
    <p><strong>Cashier:</strong> ${escapeHtml(sale.cashierName ?? "—")}</p>
    <p><strong>Customer Type:</strong> ${escapeHtml(customerTypeLabel(sale.customerType))}</p>
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
    <div><span>Payment Method</span><span>${escapeHtml(methodLabel)}</span></div>
    <div><span>Amount Paid</span><span>${formatCurrency(amountPaid)}</span></div>
    ${
      balance > 0
        ? `<div><span>Balance</span><span>${formatCurrency(balance)}</span></div>`
        : ""
    }
  </div>
  <p class="footer">${thankYou}</p>
</body>
</html>`;
}

const PRINT_WINDOW_LOADING_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Preparing receipt…</title></head>
<body><p style="font-family:system-ui,sans-serif;padding:1.5rem;">Preparing receipt…</p></body>
</html>`;

/** Open a print window synchronously (call directly from a user gesture). */
export function openPosReceiptPrintWindow(): Window | null {
  const printWindow = window.open("about:blank", "_blank");
  if (!printWindow) return null;

  printWindow.document.open();
  printWindow.document.write(PRINT_WINDOW_LOADING_HTML);
  printWindow.document.close();
  return printWindow;
}

function finalizePosReceiptPrint(printWindow: Window): void {
  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.addEventListener(
      "afterprint",
      () => {
        printWindow.close();
      },
      { once: true }
    );
  };

  const waitForAssets = () => {
    const images = Array.from(printWindow.document.images);
    if (images.length === 0) {
      triggerPrint();
      return;
    }

    let settled = 0;
    const onSettled = () => {
      settled += 1;
      if (settled >= images.length) triggerPrint();
    };

    for (const image of images) {
      if (image.complete) onSettled();
      else {
        image.addEventListener("load", onSettled, { once: true });
        image.addEventListener("error", onSettled, { once: true });
      }
    }
  };

  if (printWindow.document.readyState === "complete") {
    waitForAssets();
  } else {
    printWindow.addEventListener("load", waitForAssets, { once: true });
  }
}

/** Render receipt HTML into a pre-opened window and trigger print. */
export function renderPosReceiptInWindow(
  printWindow: Window | null,
  sale: PosSale,
  branding?: PosReceiptBranding
): void {
  const html = buildPosReceiptDocumentHtml(sale, branding);

  if (!printWindow || printWindow.closed) {
    const fallback = window.open("about:blank", "_blank");
    if (!fallback) return;
    fallback.document.open();
    fallback.document.write(html);
    fallback.document.close();
    finalizePosReceiptPrint(fallback);
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  finalizePosReceiptPrint(printWindow);
}

/** Print receipt — opens window immediately; prefer pre-opened window after async work. */
export function printPosReceipt(
  sale: PosSale,
  branding?: PosReceiptBranding
): void {
  const printWindow = openPosReceiptPrintWindow();
  renderPosReceiptInWindow(printWindow, sale, branding);
}
