import {
  BedDouble,
  CalendarCheck,
  CalendarX,
  CircleDollarSign,
  DoorClosed,
  DoorOpen,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/types";

type DashboardStatsProps = {
  stats: DashboardStats;
};

export function DashboardStatsGrid({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <StatCard
        title="Available Rooms"
        value={stats.availableRooms}
        description={`of ${stats.totalRooms} total`}
        icon={DoorOpen}
      />
      <StatCard
        title="Occupied Rooms"
        value={stats.occupiedRooms}
        description={`${stats.occupancyRate}% occupancy`}
        icon={BedDouble}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Reserved Rooms"
        value={stats.reservedRooms}
        description="By room status"
        icon={DoorClosed}
        iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Revenue Today"
        value={formatCurrency(stats.revenueToday)}
        description="All departments"
        icon={CircleDollarSign}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Check-ins Today"
        value={stats.checkInsToday}
        description="Expected arrivals"
        icon={CalendarCheck}
        iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
      />
      <StatCard
        title="Check-outs Today"
        value={stats.checkOutsToday}
        description="Expected departures"
        icon={CalendarX}
        iconClassName="bg-rose-500/10 text-rose-600 dark:text-rose-400"
      />
    </div>
  );
}
