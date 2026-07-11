import { PAYMENT_METHOD_LABELS } from "@/lib/analytics/payment-labels";
import {
  buildReceiptHeaderBlock,
  buildReceiptPrintBadge,
  escapeReceiptHtml,
  formatReceiptDate,
  formatReceiptDateTime,
  printReceiptHtml,
  RECEIPT_BASE_STYLES,
  renderReceiptInWindow,
  type ReceiptBranding,
} from "@/lib/receipt/receipt-core";
import { formatCurrency } from "@/lib/utils";
import type { Payment, PaymentTimelineEntry } from "@/types/payment";
import type { Reservation } from "@/types/reservation";

export type RoomPaymentReceiptData = {
  receiptNumber: string;
  reservationNumber: string;
  guestName: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  accommodationCharge: number;
  vatAmount: number;
  discount: number;
  totalDue: number;
  amountPaid: number;
  balanceAfter: number;
  paymentMethod: string;
  cashierName: string;
  paymentDate: string;
  notes?: string;
  printCount?: number;
};

export function buildRoomPaymentReceiptDocumentHtml(
  data: RoomPaymentReceiptData,
  branding?: ReceiptBranding
): string {
  const accent = branding?.primaryColor ?? "#1e3a5f";
  const thankYou = branding?.thankYouMessage
    ? escapeReceiptHtml(branding.thankYouMessage)
    : "";
  const printBadge =
    data.printCount && data.printCount > 0
      ? buildReceiptPrintBadge(data.printCount)
      : buildReceiptPrintBadge(1);
  const qrBlock = branding?.showQrCode
    ? `<div class="qr">QR Code</div>`
    : "";
  const footerBlock = [
    branding?.footerMessage
      ? `<p class="muted">${escapeReceiptHtml(branding.footerMessage)}</p>`
      : "",
    thankYou ? `<p class="footer">${thankYou}</p>` : "",
  ]
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeReceiptHtml(data.receiptNumber)}</title>
  <style>
    ${RECEIPT_BASE_STYLES}
    h2 { color: ${accent}; }
    .amount-paid { font-size: 1.2rem; font-weight: 700; color: ${accent}; }
  </style>
</head>
<body>
  ${buildReceiptHeaderBlock(branding, "Room Payment Receipt")}
  ${printBadge}
  <h2>Payment Receipt</h2>
  <div class="meta">
    <p><strong>Receipt Number:</strong> ${escapeReceiptHtml(data.receiptNumber)}</p>
    <p><strong>Reservation:</strong> ${escapeReceiptHtml(data.reservationNumber)}</p>
    <p><strong>Guest:</strong> ${escapeReceiptHtml(data.guestName)}</p>
    <p><strong>Room:</strong> ${escapeReceiptHtml(data.roomNumber)} · ${escapeReceiptHtml(data.roomType)}</p>
    <p><strong>Check-In:</strong> ${formatReceiptDate(data.checkInDate)}</p>
    <p><strong>Check-Out:</strong> ${formatReceiptDate(data.checkOutDate)}</p>
    <p><strong>Nights:</strong> ${data.nights}</p>
    <p><strong>Payment Date:</strong> ${formatReceiptDateTime(data.paymentDate)}</p>
    <p><strong>Cashier:</strong> ${escapeReceiptHtml(data.cashierName)}</p>
  </div>
  <div class="divider"></div>
  <div class="totals">
    <div><span>Accommodation Charge</span><span>${formatCurrency(data.accommodationCharge)}</span></div>
    ${
      data.discount > 0
        ? `<div><span>Discount</span><span>-${formatCurrency(data.discount)}</span></div>`
        : ""
    }
    <div><span>VAT</span><span>${formatCurrency(data.vatAmount)}</span></div>
    <div class="total"><span>Total</span><span>${formatCurrency(data.totalDue)}</span></div>
    <div><span>Amount Paid</span><span class="amount-paid">${formatCurrency(data.amountPaid)}</span></div>
    <div><span>Balance</span><span>${formatCurrency(data.balanceAfter)}</span></div>
    <div><span>Payment Method</span><span>${escapeReceiptHtml(data.paymentMethod)}</span></div>
  </div>
  ${
    data.notes
      ? `<div class="divider"></div><p class="muted"><strong>Notes:</strong> ${escapeReceiptHtml(data.notes)}</p>`
      : ""
  }
  ${qrBlock}
  ${footerBlock}
</body>
</html>`;
}

export function buildRoomPaymentReceiptFromPayment(
  payment: Payment,
  entry: PaymentTimelineEntry,
  reservation: Pick<
    Reservation,
    | "checkInDate"
    | "checkOutDate"
    | "numberOfNights"
    | "roomTypeName"
    | "subtotal"
    | "taxes"
  >,
  options?: {
    accommodationCharge?: number;
    discount?: number;
    cashierName?: string;
    branding?: ReceiptBranding;
  }
): RoomPaymentReceiptData {
  const accommodation =
    options?.accommodationCharge ??
    Math.max(0, reservation.subtotal - (options?.discount ?? 0));

  return {
    receiptNumber: entry.receiptNumber ?? payment.reference,
    reservationNumber: payment.reservationNumber,
    guestName: payment.guestName,
    roomNumber: payment.roomNumber,
    roomType: reservation.roomTypeName,
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
    nights: reservation.numberOfNights,
    accommodationCharge: accommodation,
    vatAmount: entry.vatAmount ?? reservation.taxes,
    discount: options?.discount ?? 0,
    totalDue: payment.totalDue,
    amountPaid: entry.amount,
    balanceAfter: payment.balance,
    paymentMethod: PAYMENT_METHOD_LABELS[entry.method] ?? entry.method,
    cashierName: options?.cashierName ?? "Reception",
    paymentDate: entry.date,
    notes: entry.description !== "Payment recorded" ? entry.description : undefined,
  };
}

export function printRoomPaymentReceipt(
  data: RoomPaymentReceiptData,
  branding?: ReceiptBranding
): void {
  printReceiptHtml(buildRoomPaymentReceiptDocumentHtml(data, branding));
}

export function printRoomPaymentReceiptFromPayment(
  payment: Payment,
  entry: PaymentTimelineEntry,
  reservation: Pick<
    Reservation,
    | "checkInDate"
    | "checkOutDate"
    | "numberOfNights"
    | "roomTypeName"
    | "subtotal"
    | "taxes"
  >,
  branding?: ReceiptBranding,
  options?: { accommodationCharge?: number; discount?: number; cashierName?: string }
): void {
  const data = buildRoomPaymentReceiptFromPayment(
    payment,
    entry,
    reservation,
    { ...options, branding }
  );
  printReceiptHtml(buildRoomPaymentReceiptDocumentHtml(data, branding));
}

export { renderReceiptInWindow };
