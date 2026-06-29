import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductCategoriesPageContent } from "@/features/product-categories/components/ProductCategoriesPageContent";
import { ProductCategoriesPageSkeleton } from "@/features/product-categories/components/ProductCategoriesPageSkeleton";
import { loadProductCategoriesPageData } from "@/features/product-categories/load-product-categories-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Product Categories",
  description: `Retail product category management for ${siteConfig.name}`,
};

async function ProductCategoriesPageLoader() {
  const { categories, stats, access } = await loadProductCategoriesPageData();
  return (
    <ProductCategoriesPageContent
      categories={categories}
      stats={stats}
      access={access}
    />
  );
}

export default function ProductCategoriesPage() {
  return (
    <Suspense fallback={<ProductCategoriesPageSkeleton />}>
      <ProductCategoriesPageLoader />
    </Suspense>
  );
}
