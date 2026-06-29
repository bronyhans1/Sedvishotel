import {
  BedDouble,
  Sparkles,
  CircleCheck,
  DoorClosed,
  DoorOpen,
  Wrench,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import type { RoomStats } from "@/types/room";

type RoomsStatsProps = {
  stats: RoomStats;
};

export function RoomsStats({ stats }: RoomsStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Rooms"
        value={stats.total}
        description="SEDVIS HOTEL inventory"
        icon={BedDouble}
      />
      <StatCard
        title="Available Rooms"
        value={stats.available}
        icon={DoorOpen}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Occupied Rooms"
        value={stats.occupied}
        icon={DoorClosed}
        iconClassName="bg-red-500/10 text-red-600 dark:text-red-400"
      />
      <StatCard
        title="Reserved Rooms"
        value={stats.reserved}
        icon={CircleCheck}
        iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Cleaning Rooms"
        value={stats.cleaning}
        icon={Sparkles}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Maintenance Rooms"
        value={stats.maintenance}
        icon={Wrench}
        iconClassName="bg-slate-500/10 text-slate-600 dark:text-slate-400"
      />
    </div>
  );
}
