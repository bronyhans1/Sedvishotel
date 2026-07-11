import type {
  ActivityLogFilters,
  CreateActivityLogInput,
  IActivityLogRepository,
} from "@/repositories/activity-log.repository";
import type { PaginatedResult, PaginationParams } from "@/repositories/types";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DbActivityLog } from "@/types/database";

export class SupabaseActivityLogRepository implements IActivityLogRepository {
  constructor(private readonly client: SupabaseServerClient) {}

  async create(input: CreateActivityLogInput): Promise<DbActivityLog> {
    const { data, error } = await this.client
      .from("activity_logs")
      .insert({
        user_id: input.userId ?? null,
        user_name: input.userName ?? null,
        action: input.action,
        action_code: input.actionCode,
        module: input.module,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        ip_address: input.ipAddress ?? null,
        status: input.status ?? "success",
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to write activity log: ${error?.message ?? "unknown"}`);
    }

    return data;
  }

  async findById(): Promise<DbActivityLog | null> {
    throw new Error("SupabaseActivityLogRepository.findById not implemented");
  }

  async findAll(
    filters?: ActivityLogFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<DbActivityLog>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 200;

    let query = this.client
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters?.module) {
      query = query.eq("module", filters.module);
    }
    if (filters?.actionCode) {
      query = query.eq("action_code", filters.actionCode);
    }
    if (filters?.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }
    if (filters?.entityId) {
      query = query.eq("entity_id", filters.entityId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte("created_at", `${filters.dateFrom}T00:00:00.000Z`);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", `${filters.dateTo}T23:59:59.999Z`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list activity logs: ${error.message}`);
    }

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  async findRecent(limit = 20): Promise<DbActivityLog[]> {
    const { data, error } = await this.client
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to load recent activity logs: ${error.message}`);
    }

    return data ?? [];
  }

  async findByEntityId(
    entityId: string,
    module = "rooms"
  ): Promise<DbActivityLog[]> {
    const { data, error } = await this.client
      .from("activity_logs")
      .select("*")
      .eq("entity_id", entityId)
      .eq("module", module)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to load activity logs: ${error.message}`);
    }

    return data ?? [];
  }

  async findReceiptPrintEvents(paymentId: string): Promise<DbActivityLog[]> {
    const { data, error } = await this.client
      .from("activity_logs")
      .select("*")
      .eq("entity_id", paymentId)
      .eq("module", "payments")
      .in("action_code", [
        "payment.receipt_printed",
        "payment.receipt_reprinted",
      ])
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to load receipt print history: ${error.message}`);
    }

    return data ?? [];
  }

  async logReservationEvent(): Promise<DbActivityLog> {
    throw new Error("SupabaseActivityLogRepository.logReservationEvent not implemented");
  }

  async logPaymentEvent(): Promise<DbActivityLog> {
    throw new Error("SupabaseActivityLogRepository.logPaymentEvent not implemented");
  }

  async logRoomStatusEvent(): Promise<DbActivityLog> {
    throw new Error("SupabaseActivityLogRepository.logRoomStatusEvent not implemented");
  }

  async logStaffEvent(): Promise<DbActivityLog> {
    throw new Error("SupabaseActivityLogRepository.logStaffEvent not implemented");
  }
}
