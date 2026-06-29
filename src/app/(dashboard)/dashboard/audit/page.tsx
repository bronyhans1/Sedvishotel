import type { Metadata } from "next";
import { Suspense } from "react";

import { AuditPageContent } from "@/features/audit/components/AuditPageContent";
import { loadAuditPageData } from "@/features/audit/load-audit-page";
import { PageLoader } from "@/components/loading/PageLoader";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Audit Dashboard",
  description: `Audit dashboard for ${siteConfig.name}`,
};

async function AuditPageLoader() {
  const data = await loadAuditPageData();
  return <AuditPageContent {...data} />;
}

export default function AuditPage() {
  return (
    <Suspense
      fallback={<PageLoader statCount={4} tableColumns={4} tableRows={6} showFilters={false} />}
    >
      <AuditPageLoader />
    </Suspense>
  );
}
