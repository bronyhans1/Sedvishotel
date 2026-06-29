import { PageLoader } from "@/components/loading/PageLoader";

export function ProductsPageSkeleton() {
  return <PageLoader statCount={4} tableColumns={9} tableRows={8} />;
}
