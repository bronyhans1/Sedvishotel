import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { IReservationBlockRepository } from "@/repositories/reservation-block.repository";
import type { DbReservationBlock } from "@/types/database";

export class SupabaseReservationBlockRepository implements IReservationBlockRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getById(id: string): Promise<DbReservationBlock | null> {
    const { data, error } = await this.client
      .from("reservation_blocks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load reservation block: ${error.message}`);
    return data;
  }

  async listByGroup(groupId: string): Promise<DbReservationBlock[]> {
    const { data, error } = await this.client
      .from("reservation_blocks")
      .select("*")
      .eq("group_reservation_id", groupId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Failed to list reservation blocks: ${error.message}`);
    return data ?? [];
  }

  async listActiveBlockedRoomIds(checkIn: string, checkOut: string): Promise<string[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("reservation_blocks")
      .select("room_id, group_reservation_id, hold_until")
      .eq("status", "blocked")
      .gt("hold_until", now);

    if (error) {
      throw new Error(`Failed to load blocked rooms: ${error.message}`);
    }

    const groupIds = [...new Set((data ?? []).map((row) => row.group_reservation_id))];
    if (groupIds.length === 0) return [];

    const { data: groups, error: groupError } = await this.client
      .from("group_reservations")
      .select("id, arrival_date, departure_date")
      .in("id", groupIds);

    if (groupError) {
      throw new Error(`Failed to load groups for blocks: ${groupError.message}`);
    }

    const overlappingGroupIds = new Set(
      (groups ?? [])
        .filter((g) => g.arrival_date < checkOut && g.departure_date > checkIn)
        .map((g) => g.id)
    );

    return [
      ...new Set(
        (data ?? [])
          .filter((row) => overlappingGroupIds.has(row.group_reservation_id))
          .map((row) => String(row.room_id))
      ),
    ];
  }

  async listExpiredBlocks(asOf?: string): Promise<DbReservationBlock[]> {
    const cutoff = asOf ?? new Date().toISOString();
    const { data, error } = await this.client
      .from("reservation_blocks")
      .select("*")
      .eq("status", "blocked")
      .lte("hold_until", cutoff);
    if (error) throw new Error(`Failed to list expired blocks: ${error.message}`);
    return data ?? [];
  }

  async create(
    data: Omit<DbReservationBlock, "id" | "created_at" | "released_at">
  ): Promise<DbReservationBlock> {
    const { data: row, error } = await this.client
      .from("reservation_blocks")
      .insert(data)
      .select("*")
      .single();
    if (error || !row) {
      throw new Error(`Failed to create reservation block: ${error?.message ?? "unknown"}`);
    }
    return row;
  }

  async update(id: string, data: Partial<DbReservationBlock>): Promise<DbReservationBlock> {
    const { data: row, error } = await this.client
      .from("reservation_blocks")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !row) {
      throw new Error(`Failed to update reservation block: ${error?.message ?? "unknown"}`);
    }
    return row;
  }
}
