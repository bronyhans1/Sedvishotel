import { PageLoader } from "@/components/loading/PageLoader";

export function StockPageSkeleton() {
  return <PageLoader statCount={5} tableColumns={10} tableRows={10} />;
}
