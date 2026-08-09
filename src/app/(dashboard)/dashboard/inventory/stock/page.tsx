import type { Metadata } from "next";
import { Suspense } from "react";

import { StockPageContent } from "@/features/inventory/components/StockPageContent";
import { StockPageSkeleton } from "@/features/inventory/components/StockPageSkeleton";
import { loadStockPageData } from "@/features/inventory/load-stock-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Stock",
  description: `Inventory stock movements for ${siteConfig.name}`,
};

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

async function StockPageLoader({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const data = await loadStockPageData();
  const filter =
    params.filter === "low_stock" || params.filter === "out_of_stock"
      ? params.filter
      : "all";
  return <StockPageContent {...data} initialStockFilter={filter} />;
}

export default function StockPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<StockPageSkeleton />}>
      <StockPageLoader searchParams={searchParams} />
    </Suspense>
  );
}
