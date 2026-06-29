import { PageLoader } from "@/components/loading/PageLoader";

export function RoomTypesPageSkeleton() {
  return (
    <PageLoader
      statCount={4}
      tableColumns={5}
      tableRows={6}
    />
  );
}
