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
}

export interface IPaymentRepository {
  getAll(): Promise<DbPaymentWithRelations[]>;
  getById(id: string): Promise<DbPaymentWithRelations | null>;
  getByReservationId(
    reservationId: string
  ): Promise<DbPaymentWithRelations | null>;
  getTransactions(paymentId: string): Promise<DbPaymentTransaction[]>;
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
  getTransactionsForBusinessDate(businessDate: string): Promise<DbPaymentTransaction[]>;
}

export type PaymentRepository = IPaymentRepository & BaseRepository;
