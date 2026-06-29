import type { Metadata } from "next";
import { Suspense } from "react";

import { RolesPageContent } from "@/features/roles/components/RolesPageContent";
import { loadRolesPageData } from "@/features/roles/load-roles-page";
import { PageLoader } from "@/components/loading/PageLoader";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Roles & Permissions",
  description: `Role management for ${siteConfig.name}`,
};

async function RolesPageLoader() {
  const data = await loadRolesPageData();
  return <RolesPageContent {...data} />;
}

export default function RolesPage() {
  return (
    <Suspense
      fallback={<PageLoader statCount={0} showStats={false} tableColumns={8} tableRows={10} showFilters={false} />}
    >
      <RolesPageLoader />
    </Suspense>
  );
}
