import { PAYMENT_METHOD_LABELS } from "@/lib/analytics/payment-labels";
import { printRoomPaymentReceipt } from "@/lib/receipt/room-payment-receipt";
import type { RoomPaymentReceiptData } from "@/lib/receipt/room-payment-receipt";
import type { PaymentSettlement } from "@/lib/payments/payment-settlement";
import type { ReceiptBranding } from "@/lib/receipt/receipt-core";
import type { Reservation } from "@/types/reservation";
import type { TransactionPaymentMethod } from "@/types/payment";

export function buildRoomPaymentReceiptDraft(
  settlement: PaymentSettlement,
  reservation: Reservation,
  input: {
    amount: number;
    method: TransactionPaymentMethod;
    receiptNumber: string;
    balanceAfter: number;
    cashierName?: string;
    notes?: string;
  }
): RoomPaymentReceiptData {
  return {
    receiptNumber: input.receiptNumber,
    reservationNumber: reservation.reservationNumber,
    guestName: reservation.guestName,
    roomNumber: reservation.roomNumber,
    roomType: reservation.roomTypeName,
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
    nights: reservation.numberOfNights,
    accommodationCharge: settlement.accommodationCharge,
    vatAmount: settlement.vatAmount,
    discount: settlement.discount,
    totalDue: settlement.totalDue,
    amountPaid: input.amount,
    balanceAfter: input.balanceAfter,
    paymentMethod: PAYMENT_METHOD_LABELS[input.method] ?? input.method,
    cashierName: input.cashierName ?? "Reception",
    paymentDate: new Date().toISOString(),
    notes: input.notes,
  };
}

export function printRoomPaymentReceiptDraft(
  data: RoomPaymentReceiptData,
  branding?: ReceiptBranding
): void {
  printRoomPaymentReceipt(data, branding);
}
