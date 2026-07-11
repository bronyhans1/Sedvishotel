import type {
  IShiftHandoverIssueRepository,
  IShiftHandoverRepository,
  IShiftHandoverTaskRepository,
} from "@/repositories/shift-handover.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbShiftHandover,
  DbShiftHandoverIssue,
  DbShiftHandoverTask,
} from "@/types/database";

export class SupabaseShiftHandoverRepository implements IShiftHandoverRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getOpenShift(): Promise<DbShiftHandover | null> {
    const { data, error } = await this.client
      .from("shift_handovers")
      .select("*")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load open shift: ${error.message}`);
    }

    return data;
  }

  async getByNumber(handoverNumber: string): Promise<DbShiftHandover | null> {
    const { data, error } = await this.client
      .from("shift_handovers")
      .select("*")
      .eq("handover_number", handoverNumber)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load shift handover: ${error.message}`);
    }

    return data;
  }

  async getById(id: string): Promise<DbShiftHandover | null> {
    const { data, error } = await this.client
      .from("shift_handovers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load shift handover: ${error.message}`);
    }

    return data;
  }

  async listAll(): Promise<DbShiftHandover[]> {
    const { data, error } = await this.client
      .from("shift_handovers")
      .select("*")
      .order("opened_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list shift handovers: ${error.message}`);
    }

    return data ?? [];
  }

  async getLatestClosed(): Promise<DbShiftHandover | null> {
    const { data, error } = await this.client
      .from("shift_handovers")
      .select("*")
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load latest closed shift: ${error.message}`);
    }

    return data;
  }

  async getPendingAcknowledgement(): Promise<DbShiftHandover | null> {
    const { data, error } = await this.client
      .from("shift_handovers")
      .select("*")
      .eq("status", "closed")
      .is("acknowledged_at", null)
      .order("closed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load pending acknowledgement: ${error.message}`);
    }

    return data;
  }

  async getNextHandoverNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SH-${year}-`;

    const { data, error } = await this.client
      .from("shift_handovers")
      .select("handover_number")
      .like("handover_number", `${prefix}%`)
      .order("handover_number", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to generate handover number: ${error.message}`);
    }

    const last = data?.[0]?.handover_number;
    const nextSeq = last ? Number.parseInt(last.slice(-6), 10) + 1 : 1;
    return `${prefix}${String(nextSeq).padStart(6, "0")}`;
  }

  async create(
    data: Omit<DbShiftHandover, "id" | "created_at" | "updated_at">
  ): Promise<DbShiftHandover> {
    const { data: row, error } = await this.client
      .from("shift_handovers")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create shift handover: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async update(id: string, data: Partial<DbShiftHandover>): Promise<DbShiftHandover> {
    const { data: row, error } = await this.client
      .from("shift_handovers")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update shift handover: ${error?.message ?? "unknown"}`);
    }

    return row;
  }
}

export class SupabaseShiftHandoverTaskRepository implements IShiftHandoverTaskRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async listPending(): Promise<DbShiftHandoverTask[]> {
    const { data, error } = await this.client
      .from("shift_handover_tasks")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list pending tasks: ${error.message}`);
    }

    return data ?? [];
  }

  async listForShift(shiftHandoverId: string): Promise<DbShiftHandoverTask[]> {
    const { data, error } = await this.client
      .from("shift_handover_tasks")
      .select("*")
      .eq("shift_handover_id", shiftHandoverId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list shift tasks: ${error.message}`);
    }

    return data ?? [];
  }

  async create(
    data: Omit<DbShiftHandoverTask, "id" | "created_at" | "updated_at">
  ): Promise<DbShiftHandoverTask> {
    const { data: row, error } = await this.client
      .from("shift_handover_tasks")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create shift task: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async complete(
    id: string,
    completedBy: string,
    completedDuringShiftId: string | null
  ): Promise<DbShiftHandoverTask> {
    const { data: row, error } = await this.client
      .from("shift_handover_tasks")
      .update({
        status: "completed",
        completed_by: completedBy,
        completed_at: new Date().toISOString(),
        completed_during_shift_id: completedDuringShiftId,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to complete shift task: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async countCompletedDuringShift(shiftHandoverId: string): Promise<number> {
    const { count, error } = await this.client
      .from("shift_handover_tasks")
      .select("id", { count: "exact", head: true })
      .eq("completed_during_shift_id", shiftHandoverId);

    if (error) {
      throw new Error(`Failed to count completed tasks: ${error.message}`);
    }

    return count ?? 0;
  }
}

export class SupabaseShiftHandoverIssueRepository implements IShiftHandoverIssueRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async listOpen(): Promise<DbShiftHandoverIssue[]> {
    const { data, error } = await this.client
      .from("shift_handover_issues")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list open issues: ${error.message}`);
    }

    return data ?? [];
  }

  async create(
    data: Omit<DbShiftHandoverIssue, "id" | "created_at" | "updated_at">
  ): Promise<DbShiftHandoverIssue> {
    const { data: row, error } = await this.client
      .from("shift_handover_issues")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create shift issue: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async resolve(
    id: string,
    resolvedBy: string,
    resolvedDuringShiftId: string | null
  ): Promise<DbShiftHandoverIssue> {
    const { data: row, error } = await this.client
      .from("shift_handover_issues")
      .update({
        status: "resolved",
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        resolved_during_shift_id: resolvedDuringShiftId,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to resolve shift issue: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async countResolvedDuringShift(shiftHandoverId: string): Promise<number> {
    const { count, error } = await this.client
      .from("shift_handover_issues")
      .select("id", { count: "exact", head: true })
      .eq("resolved_during_shift_id", shiftHandoverId);

    if (error) {
      throw new Error(`Failed to count resolved issues: ${error.message}`);
    }

    return count ?? 0;
  }
}
