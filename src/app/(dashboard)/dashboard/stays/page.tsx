import type { Metadata } from "next";
import { Suspense } from "react";

import { StaysPageContent } from "@/features/stays/components/StaysPageContent";
import { StaysPageSkeleton } from "@/features/stays/components/StaysPageSkeleton";
import { loadStaysPageData } from "@/features/stays/load-stays-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Active Stays",
  description: `In-house guests at ${siteConfig.name}`,
};

async function StaysPageLoader() {
  const data = await loadStaysPageData();
  return <StaysPageContent {...data} />;
}

export default function StaysPage() {
  return (
    <Suspense fallback={<StaysPageSkeleton />}>
      <StaysPageLoader />
    </Suspense>
  );
}
