import type { DashboardStats } from "@/types";
import { computeOccupancyFromRooms } from "@/lib/occupancy";
import type { Room } from "@/types/room";

export function buildDashboardStats(params: {
  rooms: Room[];
  revenueToday: number;
  checkInsToday: number;
  checkOutsToday: number;
}): DashboardStats {
  const occupancy = computeOccupancyFromRooms(params.rooms);

  return {
    totalRooms: occupancy.total,
    availableRooms: occupancy.available,
    occupiedRooms: occupancy.occupied,
    reservedRooms: occupancy.reserved,
    cleaningRooms: occupancy.cleaning,
    maintenanceRooms: occupancy.maintenance,
    occupancyRate: occupancy.occupancyRate,
    revenueToday: params.revenueToday,
    checkInsToday: params.checkInsToday,
    checkOutsToday: params.checkOutsToday,
  };
}
