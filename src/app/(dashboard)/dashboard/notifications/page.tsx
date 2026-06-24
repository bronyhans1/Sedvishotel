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

async function NotificationsPageLoader() {
  const data = await loadNotificationsPageData();
  return <NotificationsPageContent {...data} />;
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={<PageLoader statCount={0} showStats={false} tableColumns={1} tableRows={6} showFilters={false} />}
    >
      <NotificationsPageLoader />
    </Suspense>
  );
}
