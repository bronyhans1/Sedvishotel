import { PageLoader } from "@/components/loading/PageLoader";

export function ReservationsPageSkeleton() {
  return (
    <PageLoader
      statCount={6}
      tableColumns={7}
      tableRows={8}
    />
  );
}
