import {
  AlertTriangle,
  Boxes,
  Package,
  PackageX,
  TrendingUp,
} from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency } from "@/lib/utils";
import type { InventoryStats } from "@/types/inventory";

type StockStatsProps = {
  stats: InventoryStats;
};

export function StockStats({ stats }: StockStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        title="Total Products"
        value={stats.totalProducts}
        icon={Package}
      />
      <StatCard
        title="Inventory Value (Cost)"
        value={formatCurrency(stats.totalInventoryValue)}
        icon={TrendingUp}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <StatCard
        title="Low Stock"
        value={stats.lowStockProducts}
        icon={AlertTriangle}
        iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Out of Stock"
        value={stats.outOfStockProducts}
        icon={PackageX}
        iconClassName="bg-rose-500/10 text-rose-600 dark:text-rose-400"
      />
      <StatCard
        title="Today's Movements"
        value={stats.todaysMovements}
        icon={Boxes}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );
}
