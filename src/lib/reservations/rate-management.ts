import { computeStayPricing } from "@/lib/reservations/pricing";
import { roundCurrency } from "@/lib/payments/currency";
import type { DbRoomTypePricingRule } from "@/types/database";
import type {
  OverrideReason,
  PricingMode,
  PricingSource,
  RateOverrideHistoryEntry,
  ReservationPricingInput,
  ReservationPricingSnapshot,
  RoomTypePricingRule,
} from "@/types/pricing";

/** Intrinsic booking behaviors — all other modes resolve via pricing rules table. */
export type PricingModeBehavior = "rack" | "zero" | "manual" | "rule";

export function classifyPricingModeBehavior(
  pricingMode: PricingMode
): PricingModeBehavior {
  if (pricingMode === "standard") return "rack";
  if (pricingMode === "complimentary") return "zero";
  if (pricingMode === "manual_override") return "manual";
  return "rule";
}

export function mapDbPricingRules(
  rows: DbRoomTypePricingRule[]
): RoomTypePricingRule[] {
  return rows.map((row) => ({
    id: row.id,
    pricingMode: row.pricing_mode,
    rate: Number(row.rate),
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    status: row.status,
    isActive: row.is_active,
  }));
}

/** Active rules effective on a given date (typically check-in). */
export function filterActivePricingRules(
  rules: RoomTypePricingRule[],
  asOfDate: string
): RoomTypePricingRule[] {
  return rules.filter(
    (rule) =>
      rule.status === "active" &&
      rule.isActive &&
      rule.effectiveFrom <= asOfDate &&
      (rule.effectiveTo == null || rule.effectiveTo >= asOfDate)
  );
}

/** Resolves the best matching active rule for a mode on a given date. */
export function resolveActivePricingRule(
  rules: RoomTypePricingRule[],
  pricingMode: PricingMode,
  asOfDate: string
): RoomTypePricingRule | null {
  const matches = filterActivePricingRules(rules, asOfDate).filter(
    (rule) => rule.pricingMode === pricingMode
  );
  if (matches.length === 0) return null;
  return matches.sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom)
  )[0];
}

export function computeNightlyDiscount(rackRate: number, chargedRate: number): {
  discountAmount: number;
  discountPercent: number;
} {
  const discountAmount = roundCurrency(Math.max(0, rackRate - chargedRate));
  const discountPercent =
    rackRate > 0 ? roundCurrency((discountAmount / rackRate) * 100) : 0;
  return { discountAmount, discountPercent };
}

/**
 * Resolves charged rate dynamically.
 * No hardcoded per-mode rates — rule-backed modes read from versioned pricing rules.
 */
export function resolveChargedRate(input: {
  rackRate: number;
  pricingMode: PricingMode;
  manualChargedRate?: number;
  pricingRules: RoomTypePricingRule[];
  asOfDate: string;
}): {
  chargedRate: number;
  pricingSource: PricingSource;
  pricingRuleId: string | null;
  overrideReason: OverrideReason | null;
} {
  const behavior = classifyPricingModeBehavior(input.pricingMode);

  if (behavior === "rack") {
    return {
      chargedRate: input.rackRate,
      pricingSource: "room_type_default",
      pricingRuleId: null,
      overrideReason: null,
    };
  }

  if (behavior === "zero") {
    return {
      chargedRate: 0,
      pricingSource: "complimentary",
      pricingRuleId: null,
      overrideReason: "complimentary",
    };
  }

  if (behavior === "manual") {
    const chargedRate =
      input.manualChargedRate != null && Number.isFinite(input.manualChargedRate)
        ? roundCurrency(Math.max(0, input.manualChargedRate))
        : input.rackRate;
    return {
      chargedRate,
      pricingSource: "manual_override",
      pricingRuleId: null,
      overrideReason: chargedRate < input.rackRate ? "manager_approval" : null,
    };
  }

  const rule = resolveActivePricingRule(
    input.pricingRules,
    input.pricingMode,
    input.asOfDate
  );
  if (rule) {
    const chargedRate = roundCurrency(rule.rate);
    return {
      chargedRate,
      pricingSource: "pricing_rule",
      pricingRuleId: rule.id,
      overrideReason:
        chargedRate < input.rackRate ? ("other" as OverrideReason) : null,
    };
  }

  return {
    chargedRate: input.rackRate,
    pricingSource: "room_type_default",
    pricingRuleId: null,
    overrideReason: null,
  };
}

export function buildReservationPricingSnapshot(input: {
  rackRate: number;
  checkIn: string;
  checkOut: string;
  pricingInput?: ReservationPricingInput;
  pricingRules: RoomTypePricingRule[];
  taxRate: number;
  serviceChargeRate: number;
  userId?: string;
  requireOverrideApproval?: boolean;
  walkInVat?: boolean;
}): ReservationPricingSnapshot & {
  numberOfNights: number;
  subtotal: number;
  taxes: number;
  serviceCharge: number;
  totalAmount: number;
  historyEntry?: RateOverrideHistoryEntry;
} {
  const pricingMode = input.pricingInput?.pricingMode ?? "standard";
  const resolved = resolveChargedRate({
    rackRate: input.rackRate,
    pricingMode,
    manualChargedRate: input.pricingInput?.chargedRate,
    pricingRules: input.pricingRules,
    asOfDate: input.checkIn,
  });

  const overrideReason =
    input.pricingInput?.overrideReason ?? resolved.overrideReason ?? null;
  const overrideReasonDetail =
    overrideReason === "other"
      ? input.pricingInput?.overrideReasonDetail?.trim() || null
      : input.pricingInput?.overrideReasonDetail?.trim() || null;

  const { discountAmount, discountPercent } = computeNightlyDiscount(
    input.rackRate,
    resolved.chargedRate
  );

  const hasOverride =
    resolved.chargedRate !== input.rackRate || pricingMode !== "standard";
  const now = new Date().toISOString();
  const overriddenById = hasOverride && input.userId ? input.userId : null;
  const needsApproval =
    Boolean(input.requireOverrideApproval) && discountAmount > 0;
  const approvedById = needsApproval
    ? input.pricingInput?.approvedById ?? null
    : hasOverride
      ? input.pricingInput?.approvedById ?? input.userId ?? null
      : null;

  const financials = computeStayPricing({
    roomRate: resolved.chargedRate,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    taxRate: input.taxRate,
    serviceChargeRate: input.walkInVat ? 0 : input.serviceChargeRate,
  });

  const historyEntry: RateOverrideHistoryEntry | undefined = hasOverride
    ? {
        rackRate: input.rackRate,
        chargedRate: resolved.chargedRate,
        discountAmount,
        discountPercent,
        pricingMode,
        pricingSource: resolved.pricingSource,
        overrideReason,
        changedById: input.userId ?? "",
        approvedById,
        timestamp: now,
      }
    : undefined;

  return {
    rackRate: input.rackRate,
    chargedRate: resolved.chargedRate,
    discountAmount,
    discountPercent,
    pricingMode,
    pricingSource: resolved.pricingSource,
    pricingRuleId: resolved.pricingRuleId,
    overrideReason,
    overrideReasonDetail,
    overriddenById,
    approvedById,
    overrideAt: hasOverride ? now : null,
    numberOfNights: financials.numberOfNights,
    subtotal: financials.subtotal,
    taxes: financials.taxes,
    serviceCharge: financials.serviceCharge,
    totalAmount: financials.totalAmount,
    historyEntry,
  };
}

export function appendRateOverrideHistory(
  existing: unknown,
  entry: RateOverrideHistoryEntry
): RateOverrideHistoryEntry[] {
  const history = parseRateOverrideHistory(existing);
  return [...history, entry];
}

export function parseRateOverrideHistory(value: unknown): RateOverrideHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  const records: RateOverrideHistoryEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    records.push({
      rackRate: Number(row.rack_rate ?? row.rackRate ?? 0),
      chargedRate: Number(row.charged_rate ?? row.chargedRate ?? 0),
      discountAmount: Number(row.discount_amount ?? row.discountAmount ?? 0),
      discountPercent: Number(row.discount_percent ?? row.discountPercent ?? 0),
      pricingMode: String(row.pricing_mode ?? row.pricingMode ?? "standard") as PricingMode,
      pricingSource: String(
        row.pricing_source ?? row.pricingSource ?? "room_type_default"
      ) as PricingSource,
      overrideReason:
        row.override_reason != null || row.overrideReason != null
          ? (String(row.override_reason ?? row.overrideReason) as OverrideReason)
          : null,
      changedById: String(row.changed_by_id ?? row.changedById ?? ""),
      changedByName:
        typeof row.changed_by_name === "string"
          ? row.changed_by_name
          : typeof row.changedByName === "string"
            ? row.changedByName
            : undefined,
      approvedById:
        row.approved_by_id != null || row.approvedById != null
          ? String(row.approved_by_id ?? row.approvedById)
          : null,
      timestamp: String(row.timestamp ?? ""),
    });
  }
  return records;
}

export function serializeRateOverrideHistory(
  entries: RateOverrideHistoryEntry[]
): Array<Record<string, unknown>> {
  return entries.map((entry) => ({
    rack_rate: entry.rackRate,
    charged_rate: entry.chargedRate,
    discount_amount: entry.discountAmount,
    discount_percent: entry.discountPercent,
    pricing_mode: entry.pricingMode,
    pricing_source: entry.pricingSource,
    override_reason: entry.overrideReason,
    changed_by_id: entry.changedById,
    changed_by_name: entry.changedByName ?? null,
    approved_by_id: entry.approvedById,
    timestamp: entry.timestamp,
  }));
}

export function computeRackRevenue(
  rackRate: number,
  numberOfNights: number
): number {
  return roundCurrency(rackRate * numberOfNights);
}

export function computeTotalDiscount(
  discountAmount: number,
  numberOfNights: number
): number {
  return roundCurrency(discountAmount * numberOfNights);
}

export function inferPricingModeFromBillingPolicy(
  billingPolicy: string
): PricingMode {
  if (billingPolicy === "complimentary") return "complimentary";
  if (
    billingPolicy === "company_pays_all" ||
    billingPolicy === "company_pays_accommodation" ||
    billingPolicy === "credit"
  ) {
    return "corporate_rate";
  }
  return "standard";
}

/** Rules exposed to booking UIs — active and effective on check-in date. */
export function rulesForBooking(
  rules: RoomTypePricingRule[],
  checkInDate: string
): RoomTypePricingRule[] {
  const active = filterActivePricingRules(rules, checkInDate);
  const byMode = new Map<PricingMode, RoomTypePricingRule>();
  for (const rule of active) {
    const existing = byMode.get(rule.pricingMode);
    if (!existing || rule.effectiveFrom > existing.effectiveFrom) {
      byMode.set(rule.pricingMode, rule);
    }
  }
  return [...byMode.values()];
}
