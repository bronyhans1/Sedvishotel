import type { Metadata } from "next";
import { Suspense } from "react";

import { ReportsPageContent } from "@/features/reports/components/ReportsPageContent";
import { ReportsPageSkeleton } from "@/features/reports/components/ReportsPageSkeleton";
import { loadReportsPageData } from "@/features/reports/load-reports-page";

export const metadata: Metadata = { title: "Reports" };

async function ReportsPageLoader() {
  const { data } = await loadReportsPageData();
  return <ReportsPageContent data={data} />;
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsPageSkeleton />}>
      <ReportsPageLoader />
    </Suspense>
  );
}
