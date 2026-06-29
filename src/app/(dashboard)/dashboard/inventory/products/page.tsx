import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductsPageContent } from "@/features/products/components/ProductsPageContent";
import { ProductsPageSkeleton } from "@/features/products/components/ProductsPageSkeleton";
import { loadProductsPageData } from "@/features/products/load-products-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Products",
  description: `Retail product catalog for ${siteConfig.name}`,
};

async function ProductsPageLoader() {
  const { products, stats, access, inventoryAccess, categoryOptions } =
    await loadProductsPageData();
  return (
    <ProductsPageContent
      products={products}
      stats={stats}
      access={access}
      inventoryAccess={inventoryAccess}
      categoryOptions={categoryOptions}
    />
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageLoader />
    </Suspense>
  );
}
