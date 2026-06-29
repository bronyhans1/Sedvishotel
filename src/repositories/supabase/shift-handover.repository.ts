import type { IShiftHandoverRepository } from "@/repositories/shift-handover.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbShiftHandover } from "@/types/database";

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
