import type { CreatePaymentTransactionInput } from "@/repositories/payment.repository";
import type { DbPaymentMethod, DbPaymentStatus } from "@/types/database";

export const PAYMENT_ATOMIC_ERROR_MESSAGE =
  "Unable to complete this payment. Please try again or ask a supervisor for help.";

export class PaymentAtomicError extends Error {
  readonly code = "PAYMENT_ATOMIC" as const;

  constructor(message: string = PAYMENT_ATOMIC_ERROR_MESSAGE) {
    super(message);
    this.name = "PaymentAtomicError";
  }
}

export type PaymentAtomicCommitMode = "new" | "continue";

export type PaymentAtomicCommitInput = {
  idempotencyKey?: string;
  mode: PaymentAtomicCommitMode;
  reservationId: string;
  guestId: string;
  paymentId?: string;
  reference?: string;
  recordedBy: string | null;
  paymentMethod: DbPaymentMethod;
  paymentAmount: number;
  totalDue: number;
  balanceAfter: number;
  paymentStatus: DbPaymentStatus;
  paymentDate: string;
  paymentNotes: string | null;
  transaction: CreatePaymentTransactionInput;
  reservationAmountPaid: number;
  reservationBalance: number;
  reservationTotalAmount?: number;
  reservationTaxes?: number;
  postFolioCredit?: boolean;
  folioCreditAmount?: number;
  folioCreditReference?: string | null;
};

export type PaymentAtomicCommitResult = {
  idempotentReplay: boolean;
  paymentId: string;
  transactionId: string;
  receiptNumber: string | null;
  reference: string;
};

export type PaymentAtomicRefundInput = {
  idempotencyKey?: string;
  paymentId: string;
  reservationId: string;
  paymentMethod: DbPaymentMethod;
  paymentAmount: number;
  balanceAfter: number;
  paymentStatus: DbPaymentStatus;
  paymentDate: string;
  transaction: Pick<
    CreatePaymentTransactionInput,
    "description" | "amount" | "method" | "transacted_at"
  >;
  reservationAmountPaid: number;
  reservationBalance: number;
};

export type PaymentAtomicRefundResult = {
  idempotentReplay: boolean;
  paymentId: string;
  transactionId: string;
  reference: string;
};

export type RpcPaymentCommitRow = {
  idempotent_replay?: boolean;
  payment_id?: string;
  transaction_id?: string;
  receipt_number?: string | null;
  reference?: string;
};

export function mapRpcCommitResult(row: RpcPaymentCommitRow): PaymentAtomicCommitResult {
  if (!row.payment_id || !row.transaction_id || !row.reference) {
    throw new PaymentAtomicError();
  }
  return {
    idempotentReplay: Boolean(row.idempotent_replay),
    paymentId: row.payment_id,
    transactionId: row.transaction_id,
    receiptNumber: row.receipt_number ?? null,
    reference: row.reference,
  };
}

export function mapRpcRefundResult(row: RpcPaymentCommitRow): PaymentAtomicRefundResult {
  if (!row.payment_id || !row.transaction_id || !row.reference) {
    throw new PaymentAtomicError();
  }
  return {
    idempotentReplay: Boolean(row.idempotent_replay),
    paymentId: row.payment_id,
    transactionId: row.transaction_id,
    reference: row.reference,
  };
}

export function buildPaymentCommitPayload(input: PaymentAtomicCommitInput): Record<string, unknown> {
  const tx = input.transaction;
  return {
    idempotency_key: input.idempotencyKey ?? null,
    mode: input.mode,
    reservation_id: input.reservationId,
    guest_id: input.guestId,
    payment_id: input.paymentId ?? null,
    reference: input.reference ?? null,
    recorded_by: input.recordedBy,
    payment_method: input.paymentMethod,
    payment_amount: input.paymentAmount,
    total_due: input.totalDue,
    balance_after: input.balanceAfter,
    payment_status: input.paymentStatus,
    payment_date: input.paymentDate,
    payment_notes: input.paymentNotes,
    transaction_description: tx.description,
    transaction_amount: tx.amount,
    transaction_method: tx.method,
    transacted_at: tx.transacted_at ?? null,
    receipt_number: tx.receipt_number ?? null,
    vat_applied: tx.vat_applied ?? true,
    vat_rate: tx.vat_rate ?? 0,
    vat_amount: tx.vat_amount ?? 0,
    vat_exemption_reason: tx.vat_exemption_reason ?? null,
    vat_exemption_notes: tx.vat_exemption_notes ?? null,
    vat_overridden_by: tx.vat_overridden_by ?? null,
    vat_overridden_at: tx.vat_overridden_at ?? null,
    reservation_amount_paid: input.reservationAmountPaid,
    reservation_balance: input.reservationBalance,
    reservation_total_amount: input.reservationTotalAmount ?? null,
    reservation_taxes: input.reservationTaxes ?? null,
    post_folio_credit: input.postFolioCredit ?? false,
    folio_credit_amount: input.folioCreditAmount ?? null,
    folio_credit_reference: input.folioCreditReference ?? null,
  };
}

export function buildPaymentRefundPayload(
  input: PaymentAtomicRefundInput
): Record<string, unknown> {
  const tx = input.transaction;
  return {
    idempotency_key: input.idempotencyKey ?? null,
    payment_id: input.paymentId,
    reservation_id: input.reservationId,
    payment_method: input.paymentMethod,
    payment_amount: input.paymentAmount,
    balance_after: input.balanceAfter,
    payment_status: input.paymentStatus,
    payment_date: input.paymentDate,
    transaction_description: tx.description,
    transaction_amount: tx.amount,
    transaction_method: tx.method,
    transacted_at: tx.transacted_at ?? null,
    reservation_amount_paid: input.reservationAmountPaid,
    reservation_balance: input.reservationBalance,
  };
}

export function createPaymentIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export type ProgrammaticPaymentOperation =
  | "walk_in"
  | "late_checkout"
  | "extend_stay"
  | "room_move"
  | "checkout";

export type ProgrammaticRefundOperation = "early_checkout" | "room_move";

/** Stable idempotency keys for server-initiated payments (retries dedupe safely). */
export function buildProgrammaticPaymentIdempotencyKey(
  operation: ProgrammaticPaymentOperation,
  reservationId: string,
  scope?: string
): string {
  const base = `shms:pay:${operation}:${reservationId}`;
  const normalized = scope?.trim();
  return normalized ? `${base}:${normalized}` : base;
}

/** Stable idempotency keys for server-initiated refunds. */
export function buildProgrammaticRefundIdempotencyKey(
  operation: ProgrammaticRefundOperation,
  paymentId: string,
  scope?: string
): string {
  const base = `shms:refund:${operation}:${paymentId}`;
  const normalized = scope?.trim();
  return normalized ? `${base}:${normalized}` : base;
}
