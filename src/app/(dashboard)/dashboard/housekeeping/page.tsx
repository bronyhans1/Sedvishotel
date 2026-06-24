import type { Metadata } from "next";
import { Suspense } from "react";

import { HousekeepingPageContent } from "@/features/housekeeping/components/HousekeepingPageContent";
import { HousekeepingPageSkeleton } from "@/features/housekeeping/components/HousekeepingPageSkeleton";
import { loadHousekeepingPageData } from "@/features/housekeeping/load-housekeeping-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Housekeeping",
  description: `Housekeeping board for ${siteConfig.name}`,
};

async function HousekeepingPageLoader() {
  const data = await loadHousekeepingPageData();
  return <HousekeepingPageContent {...data} />;
}

export default function HousekeepingPage() {
  return (
    <Suspense fallback={<HousekeepingPageSkeleton />}>
      <HousekeepingPageLoader />
    </Suspense>
  );
}
