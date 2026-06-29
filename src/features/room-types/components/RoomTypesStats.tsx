import { CircleDollarSign, Layers, TrendingDown, TrendingUp } from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency } from "@/lib/utils";
import type { RoomTypeStats } from "@/types/room-type";

type RoomTypesStatsProps = {
  stats: RoomTypeStats;
};

export function RoomTypesStats({ stats }: RoomTypesStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Room Types"
        value={stats.totalTypes}
        description="Active categories"
        icon={Layers}
      />
      <StatCard
        title="Average Room Price"
        value={formatCurrency(stats.averagePrice)}
        icon={CircleDollarSign}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatCard
        title="Highest Room Price"
        value={formatCurrency(stats.highestPrice)}
        icon={TrendingUp}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Lowest Room Price"
        value={formatCurrency(stats.lowestPrice)}
        icon={TrendingDown}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
    </div>
  );
}
