import type { INightAuditRepository } from "@/repositories/night-audit.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbNightAudit } from "@/types/database";

export class SupabaseNightAuditRepository implements INightAuditRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async getByDate(auditDate: string): Promise<DbNightAudit | null> {
    const { data, error } = await this.client
      .from("night_audits")
      .select("*")
      .eq("audit_date", auditDate)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load night audit: ${error.message}`);
    }

    return data;
  }

  async getByNumber(auditNumber: string): Promise<DbNightAudit | null> {
    const { data, error } = await this.client
      .from("night_audits")
      .select("*")
      .eq("night_audit_number", auditNumber)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load night audit: ${error.message}`);
    }

    return data;
  }

  async getById(id: string): Promise<DbNightAudit | null> {
    const { data, error } = await this.client
      .from("night_audits")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load night audit: ${error.message}`);
    }

    return data;
  }

  async listAll(): Promise<DbNightAudit[]> {
    const { data, error } = await this.client
      .from("night_audits")
      .select("*")
      .order("audit_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to list night audits: ${error.message}`);
    }

    return data ?? [];
  }

  async getNextAuditNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `NA-${year}-`;

    const { data, error } = await this.client
      .from("night_audits")
      .select("night_audit_number")
      .like("night_audit_number", `${prefix}%`)
      .order("night_audit_number", { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to generate night audit number: ${error.message}`);
    }

    const last = data?.[0]?.night_audit_number;
    const nextSeq = last ? Number.parseInt(last.slice(-6), 10) + 1 : 1;
    return `${prefix}${String(nextSeq).padStart(6, "0")}`;
  }

  async create(
    data: Omit<DbNightAudit, "id" | "created_at" | "updated_at">
  ): Promise<DbNightAudit> {
    const { data: row, error } = await this.client
      .from("night_audits")
      .insert(data)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to create night audit: ${error?.message ?? "unknown"}`);
    }

    return row;
  }

  async update(id: string, data: Partial<DbNightAudit>): Promise<DbNightAudit> {
    const { data: row, error } = await this.client
      .from("night_audits")
      .update(data)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Failed to update night audit: ${error?.message ?? "unknown"}`);
    }

    return row;
  }
}
