import type {
  CreateFolioEntryRecord,
  CreateGuestFolioRecord,
  IGuestFolioRepository,
} from "@/repositories/guest-folio.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbFolioEntry,
  DbGuestFolio,
  DbGuestFolioStatus,
  DbGuestFolioWithRelations,
} from "@/types/database";

const FOLIO_SELECT = `
  *,
  guest:guests!guest_folios_guest_id_fkey ( id, full_name ),
  room:rooms!guest_folios_room_id_fkey ( id, room_number ),
  reservation:reservations!guest_folios_reservation_id_fkey (
    id,
    reservation_number,
    check_in_date,
    check_out_date,
    actual_check_out_date,
    status,
    room:rooms!reservations_room_id_fkey ( room_number )
  ),
  entries:folio_entries (
    *,
    creator:users!folio_entries_created_by_fkey ( full_name )
  )
`;

type FolioRow = DbGuestFolioWithRelations;

function toFolioWithRelations(row: FolioRow | null): DbGuestFolioWithRelations | null {
  if (!row) return null;
  return {
    ...row,
    guest: row.guest ?? null,
    room: row.room ?? null,
    reservation: row.reservation ?? null,
    entries: row.entries ?? [],
  };
}

export class SupabaseGuestFolioRepository implements IGuestFolioRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getNextFolioNumber(): Promise<string> {
    const { data, error } = await this.client.rpc("next_folio_number");
    if (error) {
      throw new Error(`Failed to generate folio number: ${error.message}`);
    }
    return String(data);
  }

  async createFolio(input: CreateGuestFolioRecord): Promise<DbGuestFolio> {
    const { data, error } = await this.client
      .from("guest_folios")
      .insert({
        reservation_id: input.reservationId,
        guest_id: input.guestId,
        room_id: input.roomId ?? null,
        folio_number: input.folioNumber,
        parent_folio_id: input.parentFolioId ?? null,
        status: "open",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create guest folio: ${error?.message ?? "unknown"}`);
    }
    return data;
  }

  async getById(id: string): Promise<DbGuestFolioWithRelations | null> {
    const { data, error } = await this.client
      .from("guest_folios")
      .select(FOLIO_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load folio: ${error.message}`);
    }
    return toFolioWithRelations(data as unknown as FolioRow);
  }

  async getOpenByReservationId(
    reservationId: string
  ): Promise<DbGuestFolioWithRelations | null> {
    const { data, error } = await this.client
      .from("guest_folios")
      .select(FOLIO_SELECT)
      .eq("reservation_id", reservationId)
      .eq("status", "open")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load open folio: ${error.message}`);
    }
    return toFolioWithRelations(data as unknown as FolioRow);
  }

  async getByReservationId(
    reservationId: string
  ): Promise<DbGuestFolioWithRelations | null> {
    const folios = await this.listByReservationId(reservationId);
    if (folios.length === 0) return null;
    const open = folios.find((folio) => folio.status === "open");
    if (open) return open;
    const withAccommodation = folios.filter((folio) =>
      (folio.entries ?? []).some((entry) => entry.entry_type === "accommodation")
    );
    if (withAccommodation.length > 0) {
      return withAccommodation[0];
    }
    return folios[0];
  }

  async listByReservationId(
    reservationId: string
  ): Promise<DbGuestFolioWithRelations[]> {
    const { data, error } = await this.client
      .from("guest_folios")
      .select(FOLIO_SELECT)
      .eq("reservation_id", reservationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list folios for reservation: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toFolioWithRelations(row as unknown as FolioRow))
      .filter((row): row is DbGuestFolioWithRelations => Boolean(row));
  }

  async list(options?: {
    status?: DbGuestFolioStatus;
    fromDate?: string;
    toDate?: string;
  }): Promise<DbGuestFolioWithRelations[]> {
    let query = this.client
      .from("guest_folios")
      .select(FOLIO_SELECT)
      .order("opened_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }
    if (options?.fromDate) {
      query = query.gte("opened_at", options.fromDate);
    }
    if (options?.toDate) {
      query = query.lte("opened_at", options.toDate);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list folios: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toFolioWithRelations(row as unknown as FolioRow))
      .filter((row): row is DbGuestFolioWithRelations => Boolean(row));
  }

  async postEntry(input: CreateFolioEntryRecord): Promise<DbFolioEntry> {
    const { data, error } = await this.client
      .from("folio_entries")
      .insert({
        folio_id: input.folioId,
        entry_type: input.entryType,
        source_module: input.sourceModule,
        source_reference: input.sourceReference ?? null,
        description: input.description,
        quantity: input.quantity ?? 1,
        unit_amount: input.unitAmount ?? input.subtotal,
        subtotal: input.subtotal,
        vat_amount: input.vatAmount ?? 0,
        total: input.total,
        debit_credit: input.debitCredit,
        created_by: input.createdBy ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to post folio entry: ${error?.message ?? "unknown"}`);
    }
    return data;
  }

  async hasEntryType(folioId: string, entryType: DbFolioEntry["entry_type"]): Promise<boolean> {
    const { count, error } = await this.client
      .from("folio_entries")
      .select("*", { count: "exact", head: true })
      .eq("folio_id", folioId)
      .eq("entry_type", entryType);

    if (error) {
      throw new Error(`Failed to check folio entries: ${error.message}`);
    }
    return (count ?? 0) > 0;
  }

  async closeFolio(id: string): Promise<DbGuestFolio> {
    const { data, error } = await this.client
      .from("guest_folios")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to close folio: ${error?.message ?? "unknown"}`);
    }
    return data;
  }

  async listEntries(folioId: string): Promise<DbFolioEntry[]> {
    const { data, error } = await this.client
      .from("folio_entries")
      .select("*")
      .eq("folio_id", folioId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list folio entries: ${error.message}`);
    }
    return data ?? [];
  }

  async listEntriesForBusinessDate(businessDate: string): Promise<DbFolioEntry[]> {
    const start = `${businessDate}T00:00:00.000Z`;
    const end = `${businessDate}T23:59:59.999Z`;
    const { data, error } = await this.client
      .from("folio_entries")
      .select("*")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list folio entries for date: ${error.message}`);
    }
    return data ?? [];
  }

  async listOpenFoliosWithEntries(): Promise<DbGuestFolioWithRelations[]> {
    const { data, error } = await this.client
      .from("guest_folios")
      .select(FOLIO_SELECT)
      .eq("status", "open")
      .order("opened_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list open folios: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toFolioWithRelations(row as unknown as FolioRow))
      .filter((row): row is DbGuestFolioWithRelations => Boolean(row));
  }

  async listChildFolios(parentFolioId: string): Promise<DbGuestFolioWithRelations[]> {
    const { data, error } = await this.client
      .from("guest_folios")
      .select(FOLIO_SELECT)
      .eq("parent_folio_id", parentFolioId)
      .order("opened_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list child folios: ${error.message}`);
    }

    return (data ?? [])
      .map((row) => toFolioWithRelations(row as unknown as FolioRow))
      .filter((row): row is DbGuestFolioWithRelations => Boolean(row));
  }

  async setParentFolio(
    folioId: string,
    parentFolioId: string | null
  ): Promise<DbGuestFolio> {
    const { data, error } = await this.client
      .from("guest_folios")
      .update({ parent_folio_id: parentFolioId })
      .eq("id", folioId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to set parent folio: ${error?.message ?? "unknown"}`);
    }
    return data;
  }
}
