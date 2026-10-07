import { GUEST_ARCHIVED_MARKER } from "@/lib/guests/constants";
import {
  guestMatchesListFilters,
  sortGuestListRows,
  summarizeGuestDirectoryStats,
  type GuestListFilters,
  type GuestListKey,
  type GuestListReservation,
} from "@/lib/guests/list-order";
import { isGuestArchived } from "@/lib/guests/mapper";
import type {
  AnalyticsGuestRow,
  GuestListPageResult,
  IGuestRepository,
} from "@/repositories/guest.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbGuest } from "@/types/database";
import type { GuestStatus } from "@/types/guest";
import type { ReservationStatus } from "@/types/reservation";

const LIST_READ_BATCH = 1000;

const GUEST_LIST_KEY_SELECT =
  "id, full_name, phone, email, guest_status, total_visits, vip_status, notes";

const RESERVATION_SIGNAL_SELECT = `
  id,
  guest_id,
  status,
  check_in_date,
  check_out_date,
  actual_check_out_date,
  reservation_number,
  room:rooms!reservations_room_id_fkey (room_number)
`;

export class SupabaseGuestRepository implements IGuestRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getAll(includeArchived = false): Promise<DbGuest[]> {
    const { data, error } = await this.client
      .from("guests")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(`Failed to list guests: ${error.message}`);
    }

    const rows = data ?? [];
    if (includeArchived) return rows;
    return rows.filter((row) => !isGuestArchived(row));
  }

  async listPage(input: {
    page: number;
    pageSize: number;
    businessDate: string;
    filters: GuestListFilters;
  }): Promise<GuestListPageResult> {
    const page = input.page > 0 ? Math.floor(input.page) : 1;
    const pageSize = input.pageSize > 0 ? Math.floor(input.pageSize) : 25;
    const [keys, reservations] = await Promise.all([
      this.listVisibleGuestKeys(),
      this.listReservationSignals(),
    ]);
    const stats = summarizeGuestDirectoryStats(keys);
    const ordered = sortGuestListRows(
      keys.filter((guest) => guestMatchesListFilters(guest, input.filters)),
      reservations,
      input.businessDate
    );
    const from = (page - 1) * pageSize;
    const pageKeys = ordered.slice(from, from + pageSize);
    if (pageKeys.length === 0) {
      return { data: [], stays: [], total: ordered.length, page, pageSize, stats };
    }

    const { data, error } = await this.client
      .from("guests")
      .select("*")
      .in(
        "id",
        pageKeys.map((guest) => guest.id)
      );

    if (error) {
      throw new Error(`Failed to list guests: ${error.message}`);
    }

    const byId = new Map((data ?? []).map((row) => [row.id, row]));
    const rows = pageKeys.flatMap((key) => {
      const row = byId.get(key.id);
      return row && !isGuestArchived(row) ? [row] : [];
    });
    const stays = pageKeys.flatMap((key) => (key.stay ? [key.stay] : []));

    return {
      data: rows,
      stays,
      total: ordered.length,
      page,
      pageSize,
      stats,
    };
  }

  async listForAnalytics(): Promise<AnalyticsGuestRow[]> {
    const { data, error } = await this.client
      .from("guests")
      .select("id, total_visits, vip_status, notes")
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(`Failed to list guests for analytics: ${error.message}`);
    }

    return (data ?? [])
      .filter((row) => !isGuestArchived(row as DbGuest))
      .map((row) => ({
        id: row.id,
        total_visits: Number(row.total_visits ?? 0),
        vip_status: Boolean(row.vip_status),
        notes: row.notes,
      }));
  }

  async getById(id: string): Promise<DbGuest | null> {
    const { data, error } = await this.client
      .from("guests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load guest: ${error.message}`);
    }

    return data;
  }

  async findByEmail(email: string): Promise<DbGuest | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const { data, error } = await this.client
      .from("guests")
      .select("*")
      .ilike("email", normalized)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find guest by email: ${error.message}`);
    }

    return data;
  }

  async searchAssignable(query: string, limit = 8): Promise<DbGuest[]> {
    const safe = query.trim().replace(/[%_,.()"'\\]/g, "");
    if (safe.length < 2) return [];
    const pattern = `%${safe}%`;
    const { data, error } = await this.client
      .from("guests")
      .select(
        "id, full_name, phone, email, notes, nationality, id_type, id_number, address, guest_status, vip_status, total_visits, total_spent, document_urls, created_at, updated_at"
      )
      .or(`full_name.ilike."${pattern}",phone.ilike."${pattern}"`)
      .order("full_name", { ascending: true })
      .limit(20);

    if (error) {
      throw new Error(`Failed to search guests: ${error.message}`);
    }

    return (data ?? []).filter((row) => !isGuestArchived(row)).slice(0, limit);
  }

  async findByPhone(phone: string): Promise<DbGuest | null> {
    const trimmed = phone.trim();
    if (!trimmed) return null;

    const { data, error } = await this.client
      .from("guests")
      .select("*")
      .eq("phone", trimmed)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find guest by phone: ${error.message}`);
    }

    if (data) return data;

    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return null;

    const { data: candidates, error: listError } = await this.client
      .from("guests")
      .select("*")
      .not("phone", "is", null);

    if (listError) {
      throw new Error(`Failed to find guest by phone: ${listError.message}`);
    }

    return (
      (candidates ?? []).find(
        (row) => row.phone && row.phone.replace(/\D/g, "") === digits
      ) ?? null
    );
  }

  async create(
    data: Omit<DbGuest, "id" | "created_at" | "updated_at" | "total_visits" | "total_spent">
  ): Promise<DbGuest> {
    const { data: row, error } = await this.client
      .from("guests")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create guest: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async update(id: string, data: Partial<DbGuest>): Promise<DbGuest> {
    const { data: row, error } = await this.client
      .from("guests")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update guest: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async archive(id: string): Promise<DbGuest> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Guest not found");
    }

    const notes = Array.isArray(existing.notes) ? [...existing.notes] : [];
    if (!notes.includes(GUEST_ARCHIVED_MARKER)) {
      notes.push(GUEST_ARCHIVED_MARKER);
    }

    return this.update(id, {
      notes,
      guest_status: "checked_out",
    });
  }

  async incrementVisitStats(id: string, amountSpent: number): Promise<DbGuest> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error("Guest not found");
    }

    return this.update(id, {
      total_visits: existing.total_visits + 1,
      total_spent: Number(existing.total_spent) + amountSpent,
    });
  }

  private async listVisibleGuestKeys(): Promise<GuestListKey[]> {
    const rows: GuestListKey[] = [];
    for (let offset = 0; ; offset += LIST_READ_BATCH) {
      const { data, error } = await this.client
        .from("guests")
        .select(GUEST_LIST_KEY_SELECT)
        .order("id", { ascending: true })
        .range(offset, offset + LIST_READ_BATCH - 1);

      if (error) {
        throw new Error(`Failed to load guest list keys: ${error.message}`);
      }

      const batch = data ?? [];
      for (const row of batch) {
        if (isGuestArchived(row as DbGuest)) continue;
        rows.push({
          id: row.id,
          fullName: row.full_name,
          phone: row.phone ?? "",
          email: row.email ?? "",
          guestStatus: row.guest_status as GuestStatus,
          totalVisits: Number(row.total_visits ?? 0),
          vipStatus: Boolean(row.vip_status),
        });
      }
      if (batch.length < LIST_READ_BATCH) break;
    }
    return rows;
  }

  private async listReservationSignals(): Promise<GuestListReservation[]> {
    const rows: GuestListReservation[] = [];
    for (let offset = 0; ; offset += LIST_READ_BATCH) {
      const { data, error } = await this.client
        .from("reservations")
        .select(RESERVATION_SIGNAL_SELECT)
        .order("id", { ascending: true })
        .range(offset, offset + LIST_READ_BATCH - 1);

      if (error) {
        throw new Error(`Failed to load guest reservation signals: ${error.message}`);
      }

      const batch = data ?? [];
      for (const raw of batch) {
        const row = raw as unknown as {
          id: string;
          guest_id: string;
          status: ReservationStatus;
          check_in_date: string;
          check_out_date: string;
          actual_check_out_date: string | null;
          reservation_number: string;
          room: { room_number: string } | null;
        };
        if (!row.guest_id) continue;
        rows.push({
          id: row.id,
          guestId: row.guest_id,
          status: row.status,
          checkInDate: row.check_in_date,
          checkOutDate: row.check_out_date,
          actualCheckOutDate: row.actual_check_out_date,
          reservationNumber: row.reservation_number,
          roomNumber: row.room?.room_number ?? "",
        });
      }
      if (batch.length < LIST_READ_BATCH) break;
    }
    return rows;
  }
}
