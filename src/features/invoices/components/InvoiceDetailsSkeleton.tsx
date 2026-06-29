import { Skeleton } from "@/components/ui/skeleton";

export function InvoiceDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <Skeleton className="mx-auto h-[480px] max-w-2xl rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
