import type { DbSaleWithRelations } from "@/types/database";
import type { PosSale, PosSaleItem, PosSalePayment, PosSaleHistoryItem } from "@/types/pos";
import { POS_PAYMENT_METHOD_OPTIONS } from "@/types/pos";

export function mapDbSaleItemToPosSaleItem(row: DbSaleWithRelations["items"][number]): PosSaleItem {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    vatApplicable: row.vat_applicable,
    vatAmount: Number(row.vat_amount),
    lineSubtotal: Number(row.line_subtotal),
    total: Number(row.total),
  };
}

export function mapDbSalePaymentToPosSalePayment(
  row: DbSaleWithRelations["payments"][number]
): PosSalePayment {
  return {
    id: row.id,
    saleId: row.sale_id,
    paymentMethod: row.payment_method,
    amount: Number(row.amount),
    reference: row.reference,
    receiptNumber: row.receipt_number,
    createdAt: row.created_at,
  };
}

export function mapDbSaleToPosSale(
  row: DbSaleWithRelations,
  paymentStatus = row.payment_status
): PosSale {
  return {
    id: row.id,
    saleNumber: row.sale_number,
    customerType: row.customer_type,
    reservationId: row.reservation_id,
    guestId: row.guest_id,
    guestName: row.guest?.full_name ?? null,
    reservationNumber: row.reservation?.reservation_number ?? null,
    roomNumber: row.reservation?.room?.room_number ?? null,
    cashierId: row.cashier_id,
    cashierName: row.cashier?.full_name ?? null,
    subtotal: Number(row.subtotal),
    vatAmount: Number(row.vat_amount),
    discount: Number(row.discount),
    total: Number(row.total),
    paymentStatus,
    vatApplied: row.vat_applied,
    vatRate: row.vat_rate != null ? Number(row.vat_rate) : null,
    notes: row.notes,
    createdAt: row.created_at,
    items: (row.items ?? []).map(mapDbSaleItemToPosSaleItem),
    payments: (row.payments ?? []).map(mapDbSalePaymentToPosSalePayment),
  };
}

function paymentMethodLabel(method: PosSalePayment["paymentMethod"]): string {
  return (
    POS_PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
    method.replace(/_/g, " ")
  );
}

export function mapDbSaleToHistoryItem(
  row: DbSaleWithRelations,
  paymentStatus = row.payment_status
): PosSaleHistoryItem {
  const payment = row.payments?.[0] ?? null;
  const paymentMethod: PosSalePayment["paymentMethod"] | null =
    row.customer_type === "room_charge"
      ? "room_charge"
      : payment?.payment_method ?? null;

  return {
    id: row.id,
    saleNumber: row.sale_number,
    createdAt: row.created_at,
    cashierId: row.cashier_id,
    cashierName: row.cashier?.full_name ?? null,
    customerType: row.customer_type,
    guestName: row.guest?.full_name ?? null,
    roomNumber: row.reservation?.room?.room_number ?? null,
    saleTypeLabel:
      row.customer_type === "room_charge" ? "Charge To Room" : "Walk-In",
    paymentMethod,
    paymentMethodLabel: paymentMethod ? paymentMethodLabel(paymentMethod) : "—",
    total: Number(row.total),
    paymentStatus,
    receiptNumber: payment?.receipt_number ?? null,
  };
}
