export type { RoomStatus } from "@/types/room";

export type DashboardStats = {
  availableRooms: number;
  occupiedRooms: number;
  reservedRooms: number;
  cleaningRooms: number;
  maintenanceRooms: number;
  revenueToday: number;
  checkInsToday: number;
  checkOutsToday: number;
  totalRooms: number;
  occupancyRate: number;
};

export type UserSession = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "front_desk";
  avatarUrl?: string;
};
