import type { DbFloor } from "@/types/database";
import type { Floor, FloorFormValues } from "@/types/floor";

export function mapDbFloorToFloor(row: DbFloor, roomCount: number): Floor {
  return {
    id: row.id,
    name: row.name,
    displayOrder: row.display_order,
    description: row.description ?? "",
    active: row.active,
    roomCount,
  };
}

export function formValuesToInsert(
  values: FloorFormValues,
  displayOrder: number
): Omit<DbFloor, "id" | "created_at" | "updated_at"> {
  return {
    name: values.name.trim(),
    display_order: values.displayOrder > 0 ? values.displayOrder : displayOrder,
    description: values.description.trim() || null,
    active: true,
  };
}

export function formValuesToUpdate(
  values: FloorFormValues
): Partial<Pick<DbFloor, "name" | "display_order" | "description">> {
  return {
    name: values.name.trim(),
    display_order: values.displayOrder,
    description: values.description.trim() || null,
  };
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
