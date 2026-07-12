import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardHomeContent } from "@/features/dashboard/components/DashboardHomeContent";
import { DashboardPageSkeleton } from "@/features/dashboard/components/DashboardPageSkeleton";
import { loadDashboardPageData } from "@/features/dashboard/load-dashboard-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Dashboard",
  description: siteConfig.description,
};

async function DashboardPageLoader() {
  const { data, groupWidgets } = await loadDashboardPageData();
  return <DashboardHomeContent data={data} groupWidgets={groupWidgets} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <DashboardPageLoader />
    </Suspense>
  );
}
