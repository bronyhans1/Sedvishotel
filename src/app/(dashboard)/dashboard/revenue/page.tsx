import type { Metadata } from "next";
import { Suspense } from "react";

import { RevenuePageContent } from "@/features/revenue/components/RevenuePageContent";
import { RevenuePageSkeleton } from "@/features/revenue/components/RevenuePageSkeleton";
import { loadRevenuePageData } from "@/features/revenue/load-revenue-page";

export const metadata: Metadata = { title: "Revenue" };

async function RevenuePageLoader() {
  const { data } = await loadRevenuePageData();
  return <RevenuePageContent data={data} />;
}

export default function RevenuePage() {
  return (
    <Suspense fallback={<RevenuePageSkeleton />}>
      <RevenuePageLoader />
    </Suspense>
  );
}
