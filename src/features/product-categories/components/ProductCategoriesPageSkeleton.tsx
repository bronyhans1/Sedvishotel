import { PageLoader } from "@/components/loading/PageLoader";

export function ProductCategoriesPageSkeleton() {
  return <PageLoader statCount={4} tableColumns={6} tableRows={8} />;
}
