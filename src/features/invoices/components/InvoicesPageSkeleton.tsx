import { PageLoader } from "@/components/loading/PageLoader";

export function InvoicesPageSkeleton() {
  return (
    <PageLoader
      statCount={4}
      tableColumns={6}
      tableRows={8}
    />
  );
}
