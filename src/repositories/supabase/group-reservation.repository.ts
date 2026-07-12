import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { IGroupReservationRepository } from "@/repositories/group-reservation.repository";
import type { DbGroupReservation, DbReservationWithRelations } from "@/types/database";
import type { GroupSearchFilters } from "@/types/group-reservation";

const RESERVATION_SELECT = `
  *,
  guest:guests!reservations_guest_id_fkey ( id, full_name, phone, email, vip_status, total_visits ),
  room:rooms!reservations_room_id_fkey ( id, room_number, status ),
  room_type:room_types!reservations_room_type_id_fkey ( id, name, slug )
`;

export class SupabaseGroupReservationRepository implements IGroupReservationRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getById(id: string): Promise<DbGroupReservation | null> {
    const { data, error } = await this.client
      .from("group_reservations")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load group reservation: ${error.message}`);
    return data;
  }

  async getByGroupNumber(groupNumber: string): Promise<DbGroupReservation | null> {
    const { data, error } = await this.client
      .from("group_reservations")
      .select("*")
      .eq("group_number", groupNumber)
      .maybeSingle();
    if (error) throw new Error(`Failed to load group reservation: ${error.message}`);
    return data;
  }

  async list(filters?: GroupSearchFilters): Promise<DbGroupReservation[]> {
    let query = this.client
      .from("group_reservations")
      .select("*")
      .order("arrival_date", { ascending: false });

    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.groupType) query = query.eq("group_type", filters.groupType);
    if (filters?.corporateAccountId) {
      query = query.eq("corporate_account_id", filters.corporateAccountId);
    }
    if (filters?.arrivalFrom) query = query.gte("arrival_date", filters.arrivalFrom);
    if (filters?.arrivalTo) query = query.lte("arrival_date", filters.arrivalTo);
    if (filters?.query?.trim()) {
      const q = `%${filters.query.trim()}%`;
      query = query.or(`group_name.ilike.${q},group_number.ilike.${q}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to list group reservations: ${error.message}`);
    return data ?? [];
  }

  async search(query: string): Promise<DbGroupReservation[]> {
    return this.list({ query });
  }

  async create(
    data: Omit<DbGroupReservation, "id" | "created_at" | "updated_at" | "group_number">
  ): Promise<DbGroupReservation> {
    const groupNumber = await this.nextGroupNumber();
    const { data: row, error } = await this.client
      .from("group_reservations")
      .insert({ ...data, group_number: groupNumber })
      .select("*")
      .single();
    if (error || !row) {
      throw new Error(`Failed to create group reservation: ${error?.message ?? "unknown"}`);
    }
    return row;
  }

  async update(id: string, data: Partial<DbGroupReservation>): Promise<DbGroupReservation> {
    const { data: row, error } = await this.client
      .from("group_reservations")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !row) {
      throw new Error(`Failed to update group reservation: ${error?.message ?? "unknown"}`);
    }
    return row;
  }

  async nextGroupNumber(): Promise<string> {
    const { data, error } = await this.client.rpc("shms_next_document_number", {
      p_kind: "group_reservation",
    });
    if (error || !data) {
      throw new Error(`Failed to generate group number: ${error?.message ?? "unknown"}`);
    }
    return String(data);
  }

  async listReservations(groupId: string): Promise<DbReservationWithRelations[]> {
    const { data, error } = await this.client
      .from("reservations")
      .select(RESERVATION_SELECT)
      .eq("group_reservation_id", groupId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Failed to list group reservations: ${error.message}`);
    return (data ?? []) as unknown as DbReservationWithRelations[];
  }

  async countReservationsByStatus(groupId: string) {
    const reservations = await this.listReservations(groupId);
    return {
      total: reservations.length,
      checkedIn: reservations.filter((r) => r.status === "checked_in").length,
      checkedOut: reservations.filter(
        (r) => r.status === "checked_out" || r.status === "checked_out_early"
      ).length,
    };
  }
}
