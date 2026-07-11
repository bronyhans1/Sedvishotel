import type { BaseRepository } from "@/repositories/base.repository";
import type {
  DbPayment,
  DbPaymentTransaction,
  DbPaymentWithRelations,
} from "@/types/database";

export interface CreatePaymentTransactionInput {
  description: string;
  amount: number;
  method: DbPaymentTransaction["method"];
  transacted_at?: string;
  receipt_number?: string | null;
  vat_applied?: boolean;
  vat_rate?: number;
  vat_amount?: number;
  vat_exemption_reason?: string | null;
  vat_exemption_notes?: string | null;
  vat_overridden_by?: string | null;
  vat_overridden_at?: string | null;
}

export interface IPaymentRepository {
  getAll(): Promise<DbPaymentWithRelations[]>;
  getById(id: string): Promise<DbPaymentWithRelations | null>;
  getByReservationId(
    reservationId: string
  ): Promise<DbPaymentWithRelations | null>;
  getTransactions(paymentId: string): Promise<DbPaymentTransaction[]>;
  getTransactionById(id: string): Promise<DbPaymentTransaction | null>;
  getTransactionsForIds(paymentIds: string[]): Promise<Map<string, DbPaymentTransaction[]>>;
  create(
    payment: Omit<DbPayment, "id" | "created_at" | "updated_at">,
    transaction: CreatePaymentTransactionInput
  ): Promise<{ payment: DbPayment; transaction: DbPaymentTransaction }>;
  addTransaction(
    paymentId: string,
    transaction: CreatePaymentTransactionInput
  ): Promise<DbPaymentTransaction>;
  update(id: string, data: Partial<DbPayment>): Promise<DbPayment>;
  getNextReference(): Promise<string>;
  getNextReceiptNumber(): Promise<string>;
  recordReceiptPrint(
    transactionId: string,
    userId: string
  ): Promise<{
    printCount: number;
    receiptNumber: string;
  }>;
  getTransactionsForBusinessDate(businessDate: string): Promise<DbPaymentTransaction[]>;
  commitPaymentAtomically(
    input: import("@/lib/payments/atomic-commit").PaymentAtomicCommitInput
  ): Promise<import("@/lib/payments/atomic-commit").PaymentAtomicCommitResult>;
  commitRefundAtomically(
    input: import("@/lib/payments/atomic-commit").PaymentAtomicRefundInput
  ): Promise<import("@/lib/payments/atomic-commit").PaymentAtomicRefundResult>;
  listPaymentMethodsForGuest(guestId: string): Promise<string[]>;
}

export type PaymentRepository = IPaymentRepository & BaseRepository;
