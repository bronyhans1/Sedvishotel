import type { BaseRepository } from "@/repositories/base.repository";
import type { DbInvoice, DbInvoiceWithRelations } from "@/types/database";

export interface IInvoiceRepository {
  getAll(): Promise<DbInvoiceWithRelations[]>;
  getById(id: string): Promise<DbInvoiceWithRelations | null>;
  getByReservationId(reservationId: string): Promise<DbInvoiceWithRelations | null>;
  create(
    data: Omit<DbInvoice, "id" | "created_at" | "updated_at">
  ): Promise<DbInvoice>;
  update(id: string, data: Partial<DbInvoice>): Promise<DbInvoice>;
  markPaid(id: string): Promise<DbInvoice>;
  getNextInvoiceNumber(): Promise<string>;
}

export type InvoiceRepository = IInvoiceRepository & BaseRepository;
