import { computeFloorBreakdown, computeOccupancyFromRooms } from "@/lib/occupancy";
import { mockGuests } from "@/lib/mock-data/guests";
import { mockPayments } from "@/lib/mock-data/payments";
import { mockReservations } from "@/lib/mock-data/reservations";
import { mockRooms } from "@/lib/mock-data/rooms";
import { mockRoomTypes } from "@/lib/mock-data/room-types";
import { mockRevenueData } from "@/lib/mock-data/revenue";

const occupancy = computeOccupancyFromRooms(mockRooms);

export const occupancyReport = {
  totalRooms: occupancy.total,
  occupiedRooms: occupancy.occupied,
  availableRooms: occupancy.available,
  reservedRooms: occupancy.reserved,
  cleaningRooms: occupancy.cleaning,
  maintenanceRooms: occupancy.maintenance,
  occupancyPercentage: occupancy.occupancyRate,
  floorBreakdown: computeFloorBreakdown(mockRooms),
  roomTypeBreakdown: mockRoomTypes.map((t) => {
    const typeRooms = mockRooms.filter((r) =>
      t.assignedRoomNumbers.includes(r.roomNumber)
    );
    return {
      type: t.name,
      occupied: typeRooms.filter((r) => r.status === "occupied").length,
      total: typeRooms.length,
    };
  }),
};

export const revenueReport = {
  daily: mockRevenueData.kpis.revenueToday,
  weekly: mockRevenueData.kpis.revenueWeek,
  monthly: mockRevenueData.kpis.revenueMonth,
  yearly: mockRevenueData.kpis.revenueYear,
};

export const guestReport = {
  totalGuests: mockGuests.length,
  returningGuests: mockGuests.filter((g) => g.totalVisits > 1).length,
  vipGuests: mockGuests.filter((g) => g.vipStatus).length,
  averageStayDuration: 2.4,
};

export const reservationReport = {
  pending: mockReservations.filter((r) => r.status === "pending").length,
  confirmed: mockReservations.filter((r) => r.status === "confirmed").length,
  checkedIn: mockReservations.filter((r) => r.status === "checked_in").length,
  checkedOut: mockReservations.filter((r) => r.status === "checked_out").length,
  cancelled: mockReservations.filter((r) => r.status === "cancelled").length,
  noShow: mockReservations.filter((r) => r.status === "no_show").length,
};

export const paymentReport = {
  byMethod: mockRevenueData.byPaymentMethod,
  outstandingBalances: mockPayments.reduce((s, p) => s + p.balance, 0),
  refundSummary: {
    count: mockPayments.filter((p) => p.status === "refunded").length,
    amount: 450,
  },
};

export const reportCards = [
  {
    id: "occupancy",
    title: "Occupancy Report",
    description: "Room utilization and floor breakdown",
    href: "/dashboard/reports#occupancy",
  },
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Daily, weekly, monthly, and yearly revenue",
    href: "/dashboard/reports#revenue",
  },
  {
    id: "guests",
    title: "Guest Report",
    description: "Guest demographics and loyalty metrics",
    href: "/dashboard/reports#guests",
  },
  {
    id: "reservations",
    title: "Reservation Report",
    description: "Booking pipeline and status summary",
    href: "/dashboard/reports#reservations",
  },
  {
    id: "housekeeping",
    title: "Housekeeping Report",
    description: "Cleaning status and turnaround times",
    href: "/dashboard/housekeeping",
  },
  {
    id: "payments",
    title: "Payment Report",
    description: "Collections, balances, and refunds",
    href: "/dashboard/reports#payments",
  },
];
