import type { Metadata } from "next";
import { Suspense } from "react";

import { NotificationsPageContent } from "@/features/notifications/components/NotificationsPageContent";
import { loadNotificationsPageData } from "@/features/notifications/load-notifications-page";
import { PageLoader } from "@/components/loading/PageLoader";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Notifications",
  description: `Notifications for ${siteConfig.name}`,
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function NotificationsPageLoader({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadNotificationsPageData(params);
  return <NotificationsPageContent {...data} />;
}

export default function NotificationsPage({ searchParams }: Props) {
  return (
    <Suspense
      fallback={<PageLoader statCount={0} showStats={false} tableColumns={1} tableRows={6} showFilters={false} />}
    >
      <NotificationsPageLoader searchParams={searchParams} />
    </Suspense>
  );
}
