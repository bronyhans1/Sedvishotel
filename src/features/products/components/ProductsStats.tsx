import { Boxes, CheckCircle2, Package, PackageX } from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import type { ProductStats } from "@/types/product";

type ProductsStatsProps = {
  stats: ProductStats;
};

export function ProductsStats({ stats }: ProductsStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Products"
        value={stats.totalProducts}
        description="Catalog items"
        icon={Package}
      />
      <StatCard
        title="Active"
        value={stats.activeProducts}
        description="Ready for operations"
        icon={CheckCircle2}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Out of Stock"
        value={stats.outOfStockProducts}
        description="Unavailable for sale"
        icon={PackageX}
        iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Available for Sale"
        value={stats.availableForSaleProducts}
        description="POS-ready (future)"
        icon={Boxes}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
    </div>
  );
}
