import type { Metadata } from "next";
import { Suspense } from "react";

import { ShiftHandoverPageContent } from "@/features/shift-handover/components/ShiftHandoverPageContent";
import { loadShiftHandoverPageData } from "@/features/shift-handover/load-shift-handover-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Shift Handover",
  description: `Shift handover for ${siteConfig.name}`,
};

async function ShiftHandoverPageLoader() {
  const data = await loadShiftHandoverPageData();
  return <ShiftHandoverPageContent {...data} />;
}

export default function ShiftHandoverPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">Loading shift handover…</div>}
    >
      <ShiftHandoverPageLoader />
    </Suspense>
  );
}
