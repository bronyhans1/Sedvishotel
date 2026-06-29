import { PageLoader } from "@/components/loading/PageLoader";
import { Skeleton } from "@/components/ui/skeleton";

export function RevenuePageSkeleton() {
  return (
    <div className="space-y-6">
      <PageLoader
        showStats
        statCount={6}
        showFilters={false}
        tableRows={0}
        tableColumns={0}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
