import { PAYMENT_METHOD_LABELS } from "@/lib/analytics/payment-labels";
import {
  buildRoomPaymentReceiptDocumentHtml,
  type RoomPaymentReceiptData,
} from "@/lib/receipt/room-payment-receipt";
import { printReceiptHtml } from "@/lib/receipt/receipt-core";
import type { ReceiptBranding } from "@/lib/receipt/receipt-core";
import type { Payment, PaymentTimelineEntry } from "@/types/payment";

function receiptBaseAmount(entry: PaymentTimelineEntry): number {
  if (entry.vatApplied === false) return entry.amount;
  const vat = entry.vatAmount ?? 0;
  return Math.max(0, entry.amount - vat);
}

export function buildRoomPaymentReceiptFromTimeline(
  payment: Payment,
  entry: PaymentTimelineEntry
): RoomPaymentReceiptData {
  const accommodation = receiptBaseAmount(entry);

  return {
    receiptNumber: entry.receiptNumber ?? payment.reference,
    reservationNumber: payment.reservationNumber,
    guestName: payment.guestName,
    roomNumber: payment.roomNumber,
    roomType: "—",
    checkInDate: payment.firstPaymentDate || entry.date,
    checkOutDate: payment.lastPaymentDate || entry.date,
    nights: 1,
    accommodationCharge: accommodation,
    vatAmount: entry.vatAmount ?? 0,
    discount: 0,
    totalDue: payment.totalDue,
    amountPaid: entry.amount,
    balanceAfter: payment.balance,
    paymentMethod: PAYMENT_METHOD_LABELS[entry.method] ?? entry.method,
    cashierName: "Reception",
    paymentDate: entry.date,
    notes:
      entry.description !== "Payment recorded" ? entry.description : undefined,
    printCount: entry.printCount && entry.printCount > 0 ? entry.printCount : undefined,
  };
}

export function printTransactionReceipt(
  payment: Payment,
  entry: PaymentTimelineEntry,
  branding?: ReceiptBranding,
  printCount?: number
): void {
  if (!entry.receiptNumber && entry.kind !== "payment") return;

  const data = buildRoomPaymentReceiptFromTimeline(payment, entry);
  if (printCount !== undefined) {
    data.printCount = printCount;
  }
  printReceiptHtml(buildRoomPaymentReceiptDocumentHtml(data, branding));
}
