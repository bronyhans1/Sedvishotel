import type { Metadata } from "next";
import { Suspense } from "react";

import { NightAuditPageContent } from "@/features/night-audit/components/NightAuditPageContent";
import { loadNightAuditPageData } from "@/features/night-audit/load-night-audit-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Night Audit",
  description: `End-of-day closing for ${siteConfig.name}`,
};

async function NightAuditPageLoader() {
  const data = await loadNightAuditPageData();
  return <NightAuditPageContent {...data} />;
}

export default function NightAuditPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">Loading night audit…</div>}
    >
      <NightAuditPageLoader />
    </Suspense>
  );
}
