import type {
  CreatePricingRuleInput,
  IRoomTypePricingRuleRepository,
} from "@/repositories/room-type-pricing-rule.repository";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  DbPricingMode,
  DbPricingRuleStatus,
  DbRoomTypePricingRule,
} from "@/types/database";

export class SupabaseRoomTypePricingRuleRepository
  implements IRoomTypePricingRuleRepository
{
  constructor(private readonly client: SupabaseServerClient) {}

  async getByRoomTypeId(
    roomTypeId: string,
    options?: { includeInactive?: boolean }
  ): Promise<DbRoomTypePricingRule[]> {
    let query = this.client
      .from("room_type_pricing_rules")
      .select("*")
      .eq("room_type_id", roomTypeId)
      .order("pricing_mode", { ascending: true })
      .order("effective_from", { ascending: false });

    if (!options?.includeInactive) {
      query = query.eq("status", "active").eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to load pricing rules: ${error.message}`);
    }

    return data ?? [];
  }

  async getActiveRule(
    roomTypeId: string,
    pricingMode: DbPricingMode
  ): Promise<DbRoomTypePricingRule | null> {
    const { data, error } = await this.client
      .from("room_type_pricing_rules")
      .select("*")
      .eq("room_type_id", roomTypeId)
      .eq("pricing_mode", pricingMode)
      .eq("status", "active")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load active pricing rule: ${error.message}`);
    }

    return data;
  }

  async createVersion(input: CreatePricingRuleInput): Promise<DbRoomTypePricingRule> {
    const existing = await this.getActiveRule(
      input.room_type_id,
      input.pricing_mode
    );

    if (existing) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const effectiveTo = yesterday.toISOString().slice(0, 10);

      await this.setRuleStatus(existing.id, "expired", false, effectiveTo);
    }

    const { data, error } = await this.client
      .from("room_type_pricing_rules")
      .insert({
        room_type_id: input.room_type_id,
        pricing_mode: input.pricing_mode,
        rate: input.rate,
        effective_from: input.effective_from,
        effective_to: input.effective_to ?? null,
        status: "active",
        is_active: true,
      } as never)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to create pricing rule version: ${error?.message ?? "unknown"}`
      );
    }

    return data;
  }

  async setRuleStatus(
    id: string,
    status: DbPricingRuleStatus,
    isActive: boolean,
    effectiveTo?: string | null
  ): Promise<DbRoomTypePricingRule> {
    const patch: Partial<DbRoomTypePricingRule> = {
      status,
      is_active: isActive,
    };
    if (effectiveTo !== undefined) {
      patch.effective_to = effectiveTo;
    }

    const { data, error } = await this.client
      .from("room_type_pricing_rules")
      .update(patch as never)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to update pricing rule status: ${error?.message ?? "unknown"}`
      );
    }

    return data;
  }
}
