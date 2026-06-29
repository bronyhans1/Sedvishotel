import { Archive, Layers, ListOrdered, Tags } from "lucide-react";

import { StatCard } from "@/components/shared/StatCard";
import type { ProductCategoryStats } from "@/types/product-category";

type ProductCategoriesStatsProps = {
  stats: ProductCategoryStats;
};

export function ProductCategoriesStats({ stats }: ProductCategoriesStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Categories"
        value={stats.totalCategories}
        description="All product categories"
        icon={Tags}
      />
      <StatCard
        title="Active"
        value={stats.activeCategories}
        description="Available for POS"
        icon={Layers}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        title="Archived"
        value={stats.archivedCategories}
        description="Hidden from catalog"
        icon={Archive}
        iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      />
      <StatCard
        title="Highest Display Order"
        value={stats.highestDisplayOrder}
        description="Current sort ceiling"
        icon={ListOrdered}
        iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
    </div>
  );
}
