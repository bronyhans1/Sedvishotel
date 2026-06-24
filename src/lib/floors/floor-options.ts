import type { FloorOption } from "@/types/floor";
import type { Floor } from "@/types/floor";

export function mapFloorsToOptions(
  floors: Floor[],
  ensureFloorIds: string[] = []
): FloorOption[] {
  const ensure = new Set(ensureFloorIds.filter(Boolean));
  return floors
    .filter((floor) => floor.active || ensure.has(floor.id))
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((floor) => ({
      id: floor.id,
      name: floor.name,
      displayOrder: floor.displayOrder,
    }));
}
