import type { FloorStats } from "@/types/floor";
import { StatCard } from "@/components/shared/StatCard";
import { Building2, Layers, Archive, BedDouble } from "lucide-react";

type FloorsStatsProps = {
  stats: FloorStats;
};

export function FloorsStats({ stats }: FloorsStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Floors" value={stats.totalFloors} icon={Layers} />
      <StatCard
        title="Active Floors"
        value={stats.activeFloors}
        icon={Building2}
        iconClassName="bg-emerald-500/10 text-emerald-600"
      />
      <StatCard
        title="Archived Floors"
        value={stats.archivedFloors}
        icon={Archive}
        iconClassName="bg-slate-500/10 text-slate-600"
      />
      <StatCard
        title="Total Rooms"
        value={stats.totalRooms}
        icon={BedDouble}
        iconClassName="bg-blue-500/10 text-blue-600"
      />
    </div>
  );
}
