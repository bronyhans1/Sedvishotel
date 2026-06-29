export const POS_ATOMIC_ERROR_MESSAGE =
  "Unable to complete this sale. Please try again or ask a supervisor for help.";

export const POS_STOCK_UNAVAILABLE_MESSAGE =
  "This product is no longer available in the requested quantity.";

export class PosAtomicError extends Error {
  readonly code = "POS_ATOMIC" as const;

  constructor(message: string = POS_ATOMIC_ERROR_MESSAGE) {
    super(message);
    this.name = "PosAtomicError";
  }
}

export class PosStockUnavailableError extends Error {
  readonly code = "POS_STOCK_UNAVAILABLE" as const;

  constructor(message: string = POS_STOCK_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "PosStockUnavailableError";
  }
}

export type PosAtomicCommitItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  vatApplicable: boolean;
  vatAmount: number;
  lineSubtotal: number;
  total: number;
};

export type PosAtomicCommitInput = {
  idempotencyKey?: string;
  saleId: string;
  customerType: "walk_in" | "room_charge";
  reservationId?: string | null;
  guestId?: string | null;
  cashierId: string;
  subtotal: number;
  vatAmount: number;
  discount: number;
  total: number;
  paymentStatus: "paid" | "pending" | "void";
  vatApplied: boolean;
  vatRate: number | null;
  notes?: string | null;
  paymentMethod?: "cash" | "card" | "mobile_money" | "room_charge";
  paymentReference?: string | null;
  items: PosAtomicCommitItem[];
  postFolioDebit?: boolean;
};

export type PosAtomicCommitResult = {
  idempotentReplay: boolean;
  saleId: string;
  saleNumber: string;
  receiptNumber: string | null;
};

export type RpcPosCommitRow = {
  idempotent_replay?: boolean;
  sale_id?: string;
  sale_number?: string;
  receipt_number?: string | null;
};

export function mapRpcPosCommitResult(row: RpcPosCommitRow): PosAtomicCommitResult {
  if (!row.sale_id || !row.sale_number) {
    throw new PosAtomicError();
  }
  return {
    idempotentReplay: Boolean(row.idempotent_replay),
    saleId: row.sale_id,
    saleNumber: row.sale_number,
    receiptNumber: row.receipt_number ?? null,
  };
}

export function buildPosCommitPayload(
  input: PosAtomicCommitInput
): Record<string, unknown> {
  return {
    idempotency_key: input.idempotencyKey ?? null,
    sale_id: input.saleId,
    customer_type: input.customerType,
    reservation_id: input.reservationId ?? null,
    guest_id: input.guestId ?? null,
    cashier_id: input.cashierId,
    subtotal: input.subtotal,
    vat_amount: input.vatAmount,
    discount: input.discount,
    total: input.total,
    payment_status: input.paymentStatus,
    vat_applied: input.vatApplied,
    vat_rate: input.vatRate,
    notes: input.notes ?? null,
    payment_method: input.paymentMethod ?? null,
    payment_reference: input.paymentReference ?? null,
    post_folio_debit: input.postFolioDebit ?? false,
    items: input.items.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      vat_applicable: item.vatApplicable,
      vat_amount: item.vatAmount,
      line_subtotal: item.lineSubtotal,
      total: item.total,
    })),
  };
}

export function createPosIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function isPosStockUnavailableError(error: {
  code?: string | null;
  message?: string | null;
  details?: string | null;
} | null | undefined): boolean {
  if (!error) return false;
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  return (
    error.code === "P0001" ||
    /POS_STOCK_UNAVAILABLE|Insufficient stock/i.test(text)
  );
}
