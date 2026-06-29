import { BrandLoader } from "@/components/loading/BrandLoader";
import { TableSkeletonLoader } from "@/components/loading/TableSkeletonLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  showBrand?: boolean;
  showStats?: boolean;
  statCount?: number;
  showFilters?: boolean;
  tableRows?: number;
  tableColumns?: number;
  showAvatar?: boolean;
  className?: string;
};

export function PageLoader({
  showBrand = false,
  showStats = true,
  statCount = 4,
  showFilters = true,
  tableRows = 8,
  tableColumns = 6,
  showAvatar = false,
  className,
}: Props) {
  return (
    <div className={cn("space-y-6", className)}>
      {showBrand ? (
        <div className="flex justify-center py-4">
          <BrandLoader size="sm" />
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      )}

      {showStats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: statCount }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : null}

      {showFilters ? <Skeleton className="h-16 w-full rounded-xl" /> : null}

      {tableRows > 0 ? (
        <TableSkeletonLoader
          rows={tableRows}
          columns={tableColumns}
          showAvatar={showAvatar}
        />
      ) : null}
    </div>
  );
}
