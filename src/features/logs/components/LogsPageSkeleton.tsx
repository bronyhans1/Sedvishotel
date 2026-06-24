import { PageLoader } from "@/components/loading/PageLoader";

export function LogsPageSkeleton() {
  return (
    <PageLoader
      statCount={5}
      tableColumns={5}
      tableRows={10}
      showFilters
    />
  );
}
