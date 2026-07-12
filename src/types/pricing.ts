export type PricingMode =
  | "standard"
  | "without_ac"
  | "corporate_rate"
  | "long_stay"
  | "promotion"
  | "vip"
  | "returning_guest"
  | "complimentary"
  | "staff_rate"
  | "manual_override";

export type PricingRuleStatus = "active" | "inactive" | "expired";

export type PricingSource =
  | "room_type_default"
  | "pricing_rule"
  | "manual_override"
  | "complimentary";

export type OverrideReason =
  | "without_ac"
  | "corporate_agreement"
  | "promotion"
  | "vip"
  | "returning_guest"
  | "manager_approval"
  | "long_stay"
  | "staff_rate"
  | "complimentary"
  | "other";

/** Versioned rule row — supports date-effective and historical pricing. */
export type RoomTypePricingRule = {
  id: string;
  pricingMode: PricingMode;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: PricingRuleStatus;
  isActive: boolean;
};

/** Simplified rule shape for booking-time resolution (active rules only). */
export type ActivePricingRule = Pick<
  RoomTypePricingRule,
  "id" | "pricingMode" | "rate" | "effectiveFrom" | "effectiveTo"
>;

export type RoomTypePricingPresetForm = {
  pricingMode: PricingMode;
  configured: boolean;
  rate?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  ruleId?: string;
  status?: PricingRuleStatus;
};

export type ReservationPricingInput = {
  pricingMode?: PricingMode;
  chargedRate?: number;
  overrideReason?: OverrideReason;
  overrideReasonDetail?: string;
  approvedById?: string;
};

export type ReservationPricingSnapshot = {
  rackRate: number;
  chargedRate: number;
  discountAmount: number;
  discountPercent: number;
  pricingMode: PricingMode;
  pricingSource: PricingSource;
  pricingRuleId: string | null;
  overrideReason: OverrideReason | null;
  overrideReasonDetail: string | null;
  overriddenById: string | null;
  approvedById: string | null;
  overrideAt: string | null;
};

export type RateOverrideHistoryEntry = {
  rackRate: number;
  chargedRate: number;
  discountAmount: number;
  discountPercent: number;
  pricingMode: PricingMode;
  pricingSource: PricingSource;
  overrideReason: OverrideReason | null;
  changedById: string;
  changedByName?: string;
  approvedById: string | null;
  timestamp: string;
};

export const PRICING_MODE_LABELS: Record<PricingMode, string> = {
  standard: "Standard",
  without_ac: "Without AC",
  corporate_rate: "Corporate Rate",
  long_stay: "Long Stay",
  promotion: "Promotion",
  vip: "VIP",
  returning_guest: "Returning Guest",
  complimentary: "Complimentary",
  staff_rate: "Staff Rate",
  manual_override: "Manual Override",
};

export const PRICING_SOURCE_LABELS: Record<PricingSource, string> = {
  room_type_default: "Room Type Default",
  pricing_rule: "Pricing Rule",
  manual_override: "Manual Override",
  complimentary: "Complimentary",
};

export const PRICING_RULE_STATUS_LABELS: Record<PricingRuleStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
};

export const OVERRIDE_REASON_LABELS: Record<OverrideReason, string> = {
  without_ac: "Without AC",
  corporate_agreement: "Corporate Agreement",
  promotion: "Promotion",
  vip: "VIP",
  returning_guest: "Returning Guest",
  manager_approval: "Manager Approval",
  long_stay: "Long Stay",
  staff_rate: "Staff Rate",
  complimentary: "Complimentary",
  other: "Other",
};

/** Presets configurable per room type (excludes standard — that is the rack rate). */
export const ROOM_TYPE_PRESET_MODES: PricingMode[] = [
  "without_ac",
  "corporate_rate",
  "long_stay",
  "promotion",
  "vip",
  "returning_guest",
  "complimentary",
  "staff_rate",
];

export const BOOKING_PRICING_MODES: PricingMode[] = [
  "standard",
  ...ROOM_TYPE_PRESET_MODES,
  "manual_override",
];

/** All pricing modes shown in reports and analytics (Standard is explicit). */
export const REPORT_PRICING_MODES: PricingMode[] = [
  "standard",
  "without_ac",
  "corporate_rate",
  "vip",
  "promotion",
  "long_stay",
  "returning_guest",
  "staff_rate",
  "complimentary",
  "manual_override",
];

export const PRICE_LOCKED_TOOLTIP =
  "This reservation keeps its pricing snapshot even if room prices or pricing rules change later.";

/** @deprecated Use ROOM_TYPE_PRESET_MODES */
export const PRESET_PRICING_MODES = ROOM_TYPE_PRESET_MODES;

export function formatPricingSourceLabel(
  source: PricingSource,
  pricingMode?: PricingMode
): string {
  if (source === "pricing_rule" && pricingMode) {
    return `${PRICING_MODE_LABELS[pricingMode]} Rule`;
  }
  return PRICING_SOURCE_LABELS[source];
}
