import type { IFloorRepository } from "@/repositories/floor.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbFloor } from "@/types/database";

export class SupabaseFloorRepository implements IFloorRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getAll(includeArchived = true): Promise<DbFloor[]> {
    let query = this.client
      .from("floors")
      .select("*")
      .order("display_order", { ascending: true });

    if (!includeArchived) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list floors: ${error.message}`);
    }

    return data ?? [];
  }

  async getById(id: string): Promise<DbFloor | null> {
    const { data, error } = await this.client
      .from("floors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load floor: ${error.message}`);
    }

    return data;
  }

  async create(
    data: Omit<DbFloor, "id" | "created_at" | "updated_at">
  ): Promise<DbFloor> {
    const { data: row, error } = await this.client
      .from("floors")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create floor: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async update(id: string, data: Partial<DbFloor>): Promise<DbFloor> {
    const { data: row, error } = await this.client
      .from("floors")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update floor: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async archive(id: string): Promise<DbFloor> {
    return this.update(id, { active: false });
  }

  async getRoomCount(floorId: string): Promise<number> {
    const { count, error } = await this.client
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .eq("floor_id", floorId);

    if (error) {
      throw new Error(`Failed to count rooms on floor: ${error.message}`);
    }

    return count ?? 0;
  }

  async getNextDisplayOrder(): Promise<number> {
    const { data, error } = await this.client
      .from("floors")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to resolve display order: ${error.message}`);
    }

    return (data?.display_order ?? 0) + 1;
  }

  async reorder(items: { id: string; displayOrder: number }[]): Promise<void> {
    for (const item of items) {
      const { error } = await this.client
        .from("floors")
        .update({ display_order: item.displayOrder })
        .eq("id", item.id);

      if (error) {
        throw new Error(`Failed to reorder floors: ${error.message}`);
      }
    }
  }
}
