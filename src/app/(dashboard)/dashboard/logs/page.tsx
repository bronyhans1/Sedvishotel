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

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function LogsPageLoader({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadLogsPageData(params);
  return <LogsPageContent {...data} />;
}

export default function LogsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<LogsPageSkeleton />}>
      <LogsPageLoader searchParams={searchParams} />
    </Suspense>
  );
}
