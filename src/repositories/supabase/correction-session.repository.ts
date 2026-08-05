import type {
  CreateCorrectionSessionInput,
  CreateLockAuditInput,
  IBusinessDayLockAuditRepository,
  ICorrectionSessionRepository,
  UpdateCorrectionSessionInput,
} from "@/repositories/correction-session.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbBusinessDayLockAudit,
  DbCorrectionSession,
} from "@/types/database";

export class SupabaseCorrectionSessionRepository
  implements ICorrectionSessionRepository
{
  constructor(private readonly client: SupabaseServerClient) {}

  async getById(id: string): Promise<DbCorrectionSession | null> {
    const { data, error } = await this.client
      .from("correction_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load correction session: ${error.message}`);
    return data;
  }

  async getOpenByBusinessDate(
    businessDate: string
  ): Promise<DbCorrectionSession | null> {
    const { data, error } = await this.client
      .from("correction_sessions")
      .select("*")
      .eq("business_date", businessDate)
      .eq("status", "open")
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load open correction session: ${error.message}`);
    }
    return data;
  }

  async listByBusinessDate(
    businessDate: string
  ): Promise<DbCorrectionSession[]> {
    const { data, error } = await this.client
      .from("correction_sessions")
      .select("*")
      .eq("business_date", businessDate)
      .order("opened_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to list correction sessions: ${error.message}`);
    }
    return data ?? [];
  }

  async listOpen(): Promise<DbCorrectionSession[]> {
    const { data, error } = await this.client
      .from("correction_sessions")
      .select("*")
      .eq("status", "open")
      .order("opened_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to list open correction sessions: ${error.message}`);
    }
    return data ?? [];
  }

  async getNextSessionNumber(businessDate: string): Promise<string> {
    const prefix = `CS-${businessDate.replace(/-/g, "")}`;
    const { data } = await this.client
      .from("correction_sessions")
      .select("session_number")
      .like("session_number", `${prefix}-%`)
      .order("session_number", { ascending: false })
      .limit(1);
    const last = data?.[0]?.session_number;
    const seq = last ? Number(last.split("-").pop()) + 1 : 1;
    return `${prefix}-${String(Number.isFinite(seq) ? seq : 1).padStart(3, "0")}`;
  }

  async create(
    input: CreateCorrectionSessionInput
  ): Promise<DbCorrectionSession> {
    const { data, error } = await this.client
      .from("correction_sessions")
      .insert({
        session_number: input.sessionNumber,
        business_date: input.businessDate,
        night_audit_id: input.nightAuditId ?? null,
        reason: input.reason,
        opened_by: input.openedBy ?? null,
        status: "open",
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(`Failed to create correction session: ${error.message}`);
    }
    return data;
  }

  async update(
    id: string,
    input: UpdateCorrectionSessionInput
  ): Promise<DbCorrectionSession> {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.status !== undefined) patch.status = input.status;
    if (input.closedBy !== undefined) patch.closed_by = input.closedBy;
    if (input.closedAt !== undefined) patch.closed_at = input.closedAt;
    if (input.correctionsCount !== undefined) {
      patch.corrections_count = input.correctionsCount;
    }
    if (input.financialImpact !== undefined) {
      patch.financial_impact = input.financialImpact;
    }
    if (input.reviewNotes !== undefined) patch.review_notes = input.reviewNotes;

    const { data, error } = await this.client
      .from("correction_sessions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      throw new Error(`Failed to update correction session: ${error.message}`);
    }
    return data;
  }
}

export class SupabaseBusinessDayLockAuditRepository
  implements IBusinessDayLockAuditRepository
{
  constructor(private readonly client: SupabaseServerClient) {}

  async create(input: CreateLockAuditInput): Promise<DbBusinessDayLockAudit> {
    const { data, error } = await this.client
      .from("business_day_lock_audits")
      .insert({
        business_date: input.businessDate,
        operation: input.operation,
        module: input.module,
        reason: input.reason,
        user_id: input.userId ?? null,
        user_name: input.userName ?? null,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(`Failed to create lock audit: ${error.message}`);
    }
    return data;
  }

  async listByBusinessDate(
    businessDate: string
  ): Promise<DbBusinessDayLockAudit[]> {
    const { data, error } = await this.client
      .from("business_day_lock_audits")
      .select("*")
      .eq("business_date", businessDate)
      .order("created_at", { ascending: false });
    if (error) {
      throw new Error(`Failed to list lock audits: ${error.message}`);
    }
    return data ?? [];
  }
}
