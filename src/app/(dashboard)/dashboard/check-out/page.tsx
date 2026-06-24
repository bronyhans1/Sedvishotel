import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckOutPageContent } from "@/features/check-out/components/CheckOutPageContent";
import { CheckOutPageSkeleton } from "@/features/check-out/components/CheckOutPageSkeleton";
import { loadCheckOutPageData } from "@/features/check-out/load-check-out-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Check-Out",
  description: `Front desk check-out for ${siteConfig.name}`,
};

async function CheckOutPageLoader() {
  const data = await loadCheckOutPageData();
  return <CheckOutPageContent {...data} />;
}

export default function CheckOutPage() {
  return (
    <Suspense fallback={<CheckOutPageSkeleton />}>
      <CheckOutPageLoader />
    </Suspense>
  );
}
