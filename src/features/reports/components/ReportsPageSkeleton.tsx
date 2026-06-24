import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/loading/PageLoader";

export function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageLoader
        showStats
        statCount={6}
        showFilters={false}
        tableRows={0}
        tableColumns={0}
      />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}
