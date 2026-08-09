import type { Metadata } from "next";
import { Suspense } from "react";

import { PosDashboardPageContent } from "@/features/pos/components/PosDashboardPageContent";
import { PosDashboardPageSkeleton } from "@/features/pos/components/PosDashboardPageSkeleton";
import { loadPosDashboardPageData } from "@/features/pos/load-pos-dashboard-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "POS Dashboard",
  description: `Business Day POS sales summary for ${siteConfig.name}`,
};

async function PosDashboardLoader() {
  const data = await loadPosDashboardPageData();
  return <PosDashboardPageContent {...data} />;
}

export default function PosDashboardPage() {
  return (
    <Suspense fallback={<PosDashboardPageSkeleton />}>
      <PosDashboardLoader />
    </Suspense>
  );
}
