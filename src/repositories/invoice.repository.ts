import type { BaseRepository } from "@/repositories/base.repository";
import type {
  DbInvoice,
  DbInvoiceStatus,
  DbInvoiceWithRelations,
} from "@/types/database";

/** Status fields only — analytics paid/unpaid invoice counts. */
export type AnalyticsInvoiceStatusRow = {
  status: DbInvoiceStatus;
  balance: number;
  amount_paid: number;
};

export interface IInvoiceRepository {
  getAll(): Promise<DbInvoiceWithRelations[]>;
  /** Column-scoped invoice status rows for analytics KPIs. */
  listStatusRowsForAnalytics(): Promise<AnalyticsInvoiceStatusRow[]>;
  getById(id: string): Promise<DbInvoiceWithRelations | null>;
  getByReservationId(
    reservationId: string
  ): Promise<DbInvoiceWithRelations | null>;
  create(
    data: Omit<DbInvoice, "id" | "created_at" | "updated_at">
  ): Promise<DbInvoice>;
  update(id: string, data: Partial<DbInvoice>): Promise<DbInvoice>;
  markPaid(id: string): Promise<DbInvoice>;
  getNextInvoiceNumber(): Promise<string>;
}

export type InvoiceRepository = IInvoiceRepository & BaseRepository;
