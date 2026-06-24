import type { Metadata } from "next";
import { Suspense } from "react";

import { WalkInPageContent } from "@/features/walk-in/components/WalkInPageContent";
import { WalkInPageSkeleton } from "@/features/walk-in/components/WalkInPageSkeleton";
import { loadWalkInPageData } from "@/features/walk-in/load-walk-in-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Walk-In Booking",
  description: `Walk-in registration for ${siteConfig.name}`,
};

async function WalkInPageLoader() {
  const data = await loadWalkInPageData();
  return <WalkInPageContent {...data} />;
}

export default function WalkInPage() {
  return (
    <Suspense fallback={<WalkInPageSkeleton />}>
      <WalkInPageLoader />
    </Suspense>
  );
}
