import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckInPageContent } from "@/features/check-in/components/CheckInPageContent";
import { CheckInPageSkeleton } from "@/features/check-in/components/CheckInPageSkeleton";
import { loadCheckInPageData } from "@/features/check-in/load-check-in-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Check-In",
  description: `Front desk check-in for ${siteConfig.name}`,
};

async function CheckInPageLoader() {
  const data = await loadCheckInPageData();
  return <CheckInPageContent {...data} />;
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<CheckInPageSkeleton />}>
      <CheckInPageLoader />
    </Suspense>
  );
}
