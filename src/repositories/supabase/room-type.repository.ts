import { isUuid } from "@/lib/room-types/mapper";
import type { IRoomTypeRepository } from "@/repositories/room-type.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbRoomType } from "@/types/database";

export class SupabaseRoomTypeRepository implements IRoomTypeRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getAll(includeArchived = true): Promise<DbRoomType[]> {
    let query = this.client
      .from("room_types")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!includeArchived) {
      query = query.eq("status", "active");
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list room types: ${error.message}`);
    }

    return data ?? [];
  }

  async getById(idOrSlug: string): Promise<DbRoomType | null> {
    if (isUuid(idOrSlug)) {
      const { data, error } = await this.client
        .from("room_types")
        .select("*")
        .eq("id", idOrSlug)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load room type: ${error.message}`);
      }
      return data;
    }

    return this.findBySlug(idOrSlug);
  }

  async findBySlug(slug: string): Promise<DbRoomType | null> {
    const { data, error } = await this.client
      .from("room_types")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load room type by slug: ${error.message}`);
    }

    return data;
  }

  async create(
    data: Omit<DbRoomType, "id" | "created_at" | "updated_at">
  ): Promise<DbRoomType> {
    const { data: row, error } = await this.client
      .from("room_types")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create room type: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async update(id: string, data: Partial<DbRoomType>): Promise<DbRoomType> {
    const { data: row, error } = await this.client
      .from("room_types")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update room type: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async archive(id: string): Promise<DbRoomType> {
    return this.update(id, { status: "inactive" });
  }

  async getAssignedRoomNumbers(roomTypeId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("rooms")
      .select("room_number")
      .eq("room_type_id", roomTypeId)
      .order("room_number", { ascending: true });

    if (error) {
      throw new Error(`Failed to load assigned rooms: ${error.message}`);
    }

    return (data ?? []).map((r) => String(r.room_number));
  }

  async getNextSortOrder(): Promise<number> {
    const { data, error } = await this.client
      .from("room_types")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to resolve sort order: ${error.message}`);
    }

    return (data?.sort_order ?? 0) + 1;
  }

  async getDeleteBlockers(roomTypeId: string): Promise<string[]> {
    const blockers: string[] = [];

    const { count: roomCount, error: roomError } = await this.client
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .eq("room_type_id", roomTypeId);

    if (roomError) {
      throw new Error(`Failed to check rooms: ${roomError.message}`);
    }
    if ((roomCount ?? 0) > 0) {
      blockers.push(`${roomCount} room(s) reference this room type`);
    }

    const { count: reservationCount, error: reservationError } = await this.client
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("room_type_id", roomTypeId);

    if (reservationError) {
      throw new Error(`Failed to check reservations: ${reservationError.message}`);
    }
    if ((reservationCount ?? 0) > 0) {
      blockers.push(`${reservationCount} reservation(s) reference this room type`);
    }

    const { data: reservationIds, error: reservationIdsError } = await this.client
      .from("reservations")
      .select("id")
      .eq("room_type_id", roomTypeId);

    if (reservationIdsError) {
      throw new Error(`Failed to load reservations: ${reservationIdsError.message}`);
    }

    const ids = (reservationIds ?? []).map((r) => r.id);
    if (ids.length > 0) {
      const { count: invoiceCount, error: invoiceError } = await this.client
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .in("reservation_id", ids);

      if (invoiceError) {
        throw new Error(`Failed to check invoices: ${invoiceError.message}`);
      }
      if ((invoiceCount ?? 0) > 0) {
        blockers.push(`${invoiceCount} invoice(s) reference this room type`);
      }

      const { count: paymentCount, error: paymentError } = await this.client
        .from("payments")
        .select("*", { count: "exact", head: true })
        .in("reservation_id", ids);

      if (paymentError) {
        throw new Error(`Failed to check payments: ${paymentError.message}`);
      }
      if ((paymentCount ?? 0) > 0) {
        blockers.push(`${paymentCount} payment(s) reference this room type`);
      }
    }

    return blockers;
  }

  async delete(id: string): Promise<void> {
    const blockers = await this.getDeleteBlockers(id);
    if (blockers.length > 0) {
      throw new Error(
        `Cannot delete room type. ${blockers.join("; ")}. Archive instead.`
      );
    }

    const { error } = await this.client.from("room_types").delete().eq("id", id);
    if (error) {
      throw new Error(`Failed to delete room type: ${error.message}`);
    }
  }
}
