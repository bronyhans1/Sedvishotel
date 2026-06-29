import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  rows?: number;
  columns?: number;
  showAvatar?: boolean;
  className?: string;
};

export function TableSkeletonLoader({
  rows = 8,
  columns = 6,
  showAvatar = false,
  className,
}: Props) {
  const colCount = showAvatar ? Math.max(columns, 1) : columns;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {showAvatar ? (
                <th className="px-4 py-3">
                  <Skeleton className="h-4 w-12" />
                </th>
              ) : null}
              {Array.from({ length: colCount }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row} className="animate-pulse">
                {showAvatar ? (
                  <td className="px-4 py-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </td>
                ) : null}
                {Array.from({ length: colCount }).map((_, col) => (
                  <td key={col} className="px-4 py-3">
                    <Skeleton
                      className={cn(
                        "h-4",
                        col === 0 ? "w-32" : col === colCount - 1 ? "w-16" : "w-24"
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
