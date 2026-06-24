import { isUuid } from "@/lib/invoices/mapper";
import type { IInvoiceRepository } from "@/repositories/invoice.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbInvoice,
  DbInvoiceWithRelations,
  DbReservationWithRelations,
} from "@/types/database";

const INVOICE_SELECT = `
  *,
  guest:guests!invoices_guest_id_fkey (*),
  reservation:reservations!invoices_reservation_id_fkey (
    *,
    guest:guests!reservations_guest_id_fkey (*),
    room:rooms!reservations_room_id_fkey (*),
    room_type:room_types!reservations_room_type_id_fkey (*)
  )
`;

type InvoiceRow = DbInvoice & {
  guest: DbInvoiceWithRelations["guest"] | null;
  reservation: (DbReservationWithRelations & {
    guest: DbReservationWithRelations["guest"] | null;
    room: DbReservationWithRelations["room"] | null;
    room_type: DbReservationWithRelations["room_type"] | null;
  }) | null;
};

function toInvoiceWithRelations(
  row: InvoiceRow | null
): DbInvoiceWithRelations | null {
  if (!row?.guest || !row.reservation) return null;
  const reservation = row.reservation;
  if (!reservation.guest || !reservation.room || !reservation.room_type) {
    return null;
  }
  return {
    ...row,
    guest: row.guest,
    reservation: {
      ...reservation,
      guest: reservation.guest,
      room: reservation.room,
      room_type: reservation.room_type,
    },
  };
}

export class SupabaseInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getAll(): Promise<DbInvoiceWithRelations[]> {
    const { data, error } = await this.client
      .from("invoices")
      .select(INVOICE_SELECT)
      .order("invoice_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to list invoices: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toInvoiceWithRelations(row as unknown as InvoiceRow))
      .filter((row): row is DbInvoiceWithRelations => Boolean(row));
  }

  async getById(id: string): Promise<DbInvoiceWithRelations | null> {
    if (isUuid(id)) {
      const { data, error } = await this.client
        .from("invoices")
        .select(INVOICE_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load invoice: ${error.message}`);
      }

      return toInvoiceWithRelations((data ?? null) as unknown as InvoiceRow | null);
    }

    const { data, error } = await this.client
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("invoice_number", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load invoice by number: ${error.message}`);
    }

    return toInvoiceWithRelations((data ?? null) as unknown as InvoiceRow | null);
  }

  async getByReservationId(
    reservationId: string
  ): Promise<DbInvoiceWithRelations | null> {
    const { data, error } = await this.client
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("reservation_id", reservationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load invoice for reservation: ${error.message}`);
    }

    return toInvoiceWithRelations((data ?? null) as unknown as InvoiceRow | null);
  }

  async create(
    data: Omit<DbInvoice, "id" | "created_at" | "updated_at">
  ): Promise<DbInvoice> {
    const { data: row, error } = await this.client
      .from("invoices")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create invoice: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async update(id: string, data: Partial<DbInvoice>): Promise<DbInvoice> {
    const { data: row, error } = await this.client
      .from("invoices")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update invoice: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async markPaid(id: string): Promise<DbInvoice> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Invoice not found");
    }

    return this.update(id, {
      amount_paid: existing.total_amount,
      balance: 0,
      status: "paid",
    });
  }

  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const { count, error } = await this.client
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .like("invoice_number", `${prefix}%`);

    if (error) {
      throw new Error(`Failed to generate invoice number: ${error.message}`);
    }

    const seq = String((count ?? 0) + 1).padStart(4, "0");
    return `${prefix}${seq}`;
  }
}
