import { Skeleton } from "@/components/ui/skeleton";

export function PosPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <Skeleton className="h-10 w-48" />
      <div className="grid flex-1 gap-4 lg:grid-cols-[240px_1fr_320px]">
        <Skeleton className="h-full min-h-[400px]" />
        <Skeleton className="h-full min-h-[400px]" />
        <Skeleton className="h-full min-h-[400px]" />
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
