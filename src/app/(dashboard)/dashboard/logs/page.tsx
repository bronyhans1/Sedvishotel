import type { Metadata } from "next";
import { Suspense } from "react";

import { LogsPageContent } from "@/features/logs/components/LogsPageContent";
import { loadLogsPageData } from "@/features/logs/load-logs-page";
import { LogsPageSkeleton } from "@/features/logs/components/LogsPageSkeleton";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Activity Logs",
  description: `Activity logs for ${siteConfig.name}`,
};

async function LogsPageLoader() {
  const data = await loadLogsPageData();
  return <LogsPageContent {...data} />;
}

export default function LogsPage() {
  return (
    <Suspense
      fallback={<LogsPageSkeleton />}
    >
      <LogsPageLoader />
    </Suspense>
  );
}
