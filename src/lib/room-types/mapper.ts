import type { DbRoomType, DbRoomTypePricingRule } from "@/types/database";
import type { RoomType, RoomTypeFormValues } from "@/types/room-type";
import {
  mapDbPricingRules,
  resolveActivePricingRule,
} from "@/lib/reservations/rate-management";
import {
  ROOM_TYPE_PRESET_MODES,
  type RoomTypePricingPresetForm,
} from "@/types/pricing";
import { getTodayDateString } from "@/lib/dates/today";

export function buildPricingPresetsFromRules(
  rules: ReturnType<typeof mapDbPricingRules>,
  asOfDate: string = getTodayDateString()
): RoomTypePricingPresetForm[] {
  return ROOM_TYPE_PRESET_MODES.map((mode) => {
    const active = resolveActivePricingRule(rules, mode, asOfDate);
    if (!active) {
      return { pricingMode: mode, configured: false };
    }
    return {
      pricingMode: mode,
      configured: true,
      rate: active.rate,
      effectiveFrom: active.effectiveFrom,
      effectiveTo: active.effectiveTo,
      ruleId: active.id,
      status: active.status,
    };
  });
}

export function mapDbRoomTypeToRoomType(
  row: DbRoomType,
  assignedRoomNumbers: string[],
  pricingRules: DbRoomTypePricingRule[] = []
): RoomType {
  const rules = mapDbPricingRules(pricingRules);

  return {
    id: row.slug,
    uuid: row.id,
    name: row.name,
    description: row.description ?? "",
    defaultPrice: Number(row.default_price),
    capacity: row.capacity,
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    status: row.status,
    assignedRoomNumbers,
    pricingRules: rules,
  };
}

export function parseAmenitiesInput(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formValuesToInsert(
  values: RoomTypeFormValues,
  slug: string,
  sortOrder: number
): Omit<DbRoomType, "id" | "created_at" | "updated_at"> {
  return {
    slug,
    name: values.name.trim(),
    description: values.description.trim() || null,
    default_price: values.defaultPrice,
    capacity: values.capacity,
    amenities: parseAmenitiesInput(values.amenities),
    status: "active",
    sort_order: sortOrder,
  };
}

export function formValuesToUpdate(
  values: RoomTypeFormValues
): Partial<Pick<DbRoomType, "name" | "description" | "default_price" | "capacity" | "amenities">> {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    default_price: values.defaultPrice,
    capacity: values.capacity,
    amenities: parseAmenitiesInput(values.amenities),
  };
}

/** UUID v4 pattern for route/API id resolution */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
