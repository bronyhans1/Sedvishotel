import type { DbRoomType } from "@/types/database";
import type { RoomType, RoomTypeFormValues } from "@/types/room-type";

export function mapDbRoomTypeToRoomType(
  row: DbRoomType,
  assignedRoomNumbers: string[]
): RoomType {
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
