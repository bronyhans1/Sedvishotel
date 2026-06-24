import { PageLoader } from "@/components/loading/PageLoader";

export function GuestsPageSkeleton() {
  return (
    <PageLoader
      statCount={6}
      tableColumns={5}
      tableRows={8}
    />
  );
}
