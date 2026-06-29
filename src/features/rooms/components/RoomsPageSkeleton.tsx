import { RoomGridSkeleton } from "@/components/rooms/RoomGridSkeleton";
import { PageLoader } from "@/components/loading/PageLoader";

export function RoomsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageLoader
        statCount={5}
        showFilters
        tableRows={0}
        tableColumns={0}
      />
      <RoomGridSkeleton />
    </div>
  );
}
