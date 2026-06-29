import type { Floor, FloorStats } from "@/types/floor";

export function computeFloorStats(floors: Floor[]): FloorStats {
  const activeFloors = floors.filter((f) => f.active);
  const archivedFloors = floors.filter((f) => !f.active);
  const totalRooms = floors.reduce((sum, f) => sum + f.roomCount, 0);

  return {
    totalFloors: floors.length,
    activeFloors: activeFloors.length,
    archivedFloors: archivedFloors.length,
    totalRooms,
  };
}
