import type { IHousekeepingRepository } from "@/repositories/housekeeping.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbHousekeepingStatus, DbHousekeepingTask } from "@/types/database";

export class SupabaseHousekeepingRepository implements IHousekeepingRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async findById(id: string): Promise<DbHousekeepingTask | null> {
    const { data, error } = await this.client
      .from("housekeeping_tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load housekeeping task: ${error.message}`);
    }

    return data;
  }

  async findByRoomId(roomId: string): Promise<DbHousekeepingTask | null> {
    const { data, error } = await this.client
      .from("housekeeping_tasks")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load housekeeping task for room: ${error.message}`);
    }

    return data;
  }

  async findAll(status?: DbHousekeepingStatus): Promise<DbHousekeepingTask[]> {
    let query = this.client
      .from("housekeeping_tasks")
      .select("*")
      .order("updated_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list housekeeping tasks: ${error.message}`);
    }

    return data ?? [];
  }

  async create(
    data: Omit<DbHousekeepingTask, "id" | "created_at" | "updated_at">
  ): Promise<DbHousekeepingTask> {
    const { data: row, error } = await this.client
      .from("housekeeping_tasks")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(
        `Failed to create housekeeping task: ${error?.message ?? "unknown"}`
      );
    }

    return row;
  }

  async assignStaff(
    taskId: string,
    staffUserId: string
  ): Promise<DbHousekeepingTask> {
    return this.updateStatus(taskId, "cleaning", {
      assigned_staff_id: staffUserId,
    });
  }

  async updateStatus(
    taskId: string,
    status: DbHousekeepingStatus,
    extra?: Partial<DbHousekeepingTask>
  ): Promise<DbHousekeepingTask> {
    const { data: row, error } = await this.client
      .from("housekeeping_tasks")
      .update({ status, ...extra })
      .eq("id", taskId)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(
        `Failed to update housekeeping task: ${error?.message ?? "unknown"}`
      );
    }

    return row;
  }
}
