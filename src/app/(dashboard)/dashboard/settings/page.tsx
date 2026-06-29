import type { Metadata } from "next";
import { Suspense } from "react";

import { SettingsPageContent } from "@/features/settings/components/SettingsPageContent";
import { loadSettingsPageData } from "@/features/settings/load-settings-page";
import { PageLoader } from "@/components/loading/PageLoader";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Settings",
  description: `Hotel configuration for ${siteConfig.name}`,
};

async function SettingsPageLoader() {
  const data = await loadSettingsPageData();
  return <SettingsPageContent {...data} />;
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={<PageLoader statCount={0} showStats={false} tableColumns={2} tableRows={8} showFilters={false} />}
    >
      <SettingsPageLoader />
    </Suspense>
  );
}
