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

async function StockPageLoader() {
  const data = await loadStockPageData();
  return <StockPageContent {...data} />;
}

export default function StockPage() {
  return (
    <Suspense fallback={<StockPageSkeleton />}>
      <StockPageLoader />
    </Suspense>
  );
}
