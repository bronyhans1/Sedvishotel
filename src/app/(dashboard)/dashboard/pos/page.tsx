import type { Metadata } from "next";
import { Suspense } from "react";

import { PosPageContent } from "@/features/pos/components/PosPageContent";
import { PosPageSkeleton } from "@/features/pos/components/PosPageSkeleton";
import { loadPosPageData } from "@/features/pos/load-pos-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Retail POS",
  description: `Point of sale for ${siteConfig.name}`,
};

async function PosPageLoader() {
  const data = await loadPosPageData();
  return <PosPageContent {...data} />;
}

export default function PosPage() {
  return (
    <Suspense fallback={<PosPageSkeleton />}>
      <PosPageLoader />
    </Suspense>
  );
}
