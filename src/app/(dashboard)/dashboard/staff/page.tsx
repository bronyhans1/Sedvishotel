import type { Metadata } from "next";
import { Suspense } from "react";

import { StaffPageContent } from "@/features/staff/components/StaffPageContent";
import { StaffPageSkeleton } from "@/features/staff/components/StaffPageSkeleton";
import { loadStaffPageData } from "@/features/staff/load-staff-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Staff",
  description: `Staff management for ${siteConfig.name}`,
};

async function StaffPageLoader() {
  const data = await loadStaffPageData();
  return <StaffPageContent {...data} />;
}

export default function StaffPage() {
  return (
    <Suspense fallback={<StaffPageSkeleton />}>
      <StaffPageLoader />
    </Suspense>
  );
}
