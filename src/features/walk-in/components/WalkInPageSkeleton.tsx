import { PageContainer } from "@/components/shared/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";

export function WalkInPageSkeleton() {
  return (
    <PageContainer
      title="Walk-In Booking"
      description="Loading walk-in form…"
    >
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-2 flex-1 rounded-full" />
        ))}
      </div>
      <Skeleton className="mx-auto h-[480px] max-w-xl rounded-xl" />
    </PageContainer>
  );
}
