import type {
  DbPricingMode,
  DbPricingRuleStatus,
  DbRoomTypePricingRule,
} from "@/types/database";

export type CreatePricingRuleInput = {
  room_type_id: string;
  pricing_mode: DbPricingMode;
  rate: number;
  effective_from: string;
  effective_to?: string | null;
};

export interface IRoomTypePricingRuleRepository {
  getByRoomTypeId(
    roomTypeId: string,
    options?: { includeInactive?: boolean }
  ): Promise<DbRoomTypePricingRule[]>;
  getActiveRule(
    roomTypeId: string,
    pricingMode: DbPricingMode
  ): Promise<DbRoomTypePricingRule | null>;
  createVersion(input: CreatePricingRuleInput): Promise<DbRoomTypePricingRule>;
  setRuleStatus(
    id: string,
    status: DbPricingRuleStatus,
    isActive: boolean,
    effectiveTo?: string | null
  ): Promise<DbRoomTypePricingRule>;
}
