import type { Metadata } from "next";
import { Suspense } from "react";

import { PosPageContent } from "@/features/pos/components/PosPageContent";
import { PosPageSkeleton } from "@/features/pos/components/PosPageSkeleton";
import { loadPosPageData } from "@/features/pos/load-pos-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "POS Register",
  description: `Point of sale register for ${siteConfig.name}`,
};

async function PosRegisterLoader() {
  const data = await loadPosPageData();
  return <PosPageContent {...data} />;
}

export default function PosRegisterPage() {
  return (
    <Suspense fallback={<PosPageSkeleton />}>
      <PosRegisterLoader />
    </Suspense>
  );
}
