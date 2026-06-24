import { computeOccupancyRate } from "@/lib/occupancy";
import { mockRooms } from "@/lib/mock-data/rooms";
import type { RevenueData } from "@/types/revenue";

export const mockRevenueData: RevenueData = {
  kpis: {
    revenueToday: 1375,
    revenueWeek: 8420,
    revenueMonth: 28450,
    revenueYear: 312800,
    averageDailyRate: 385,
    occupancyRate: computeOccupancyRate(mockRooms),
    outstandingBalances: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
  },
  monthlyTrend: [
    { label: "Jan", value: 22400 },
    { label: "Feb", value: 24100 },
    { label: "Mar", value: 26800 },
    { label: "Apr", value: 25200 },
    { label: "May", value: 27900 },
    { label: "Jun", value: 28450 },
  ],
  weeklyTrend: [
    { label: "Mon", value: 980 },
    { label: "Tue", value: 1375 },
    { label: "Wed", value: 1120 },
    { label: "Thu", value: 1450 },
    { label: "Fri", value: 1680 },
    { label: "Sat", value: 1920 },
    { label: "Sun", value: 895 },
  ],
  byRoomType: [
    { label: "Standard Single", value: 4200 },
    { label: "Standard Double", value: 6800 },
    { label: "Deluxe", value: 7400 },
    { label: "Executive", value: 5600 },
    { label: "Family Suite", value: 4450 },
  ],
  byPaymentMethod: [
    { label: "Mobile Money", value: 9850 },
    { label: "Card", value: 7200 },
    { label: "Cash", value: 4100 },
    { label: "Bank Transfer", value: 3800 },
    { label: "Online", value: 3500 },
  ],
  insights: {
    bestPerformingRoomType: "Deluxe Room",
    highestRevenueDay: "Saturday",
    averageGuestSpend: 812,
    mostPopularRoomType: "Standard Double",
  },
};
