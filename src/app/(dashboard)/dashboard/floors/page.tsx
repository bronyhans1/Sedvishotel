import type { Metadata } from "next";
import { Suspense } from "react";

import { FloorsPageContent } from "@/features/floors/components/FloorsPageContent";
import { loadFloorsPageData } from "@/features/floors/load-floors-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Floors",
  description: `Floor management for ${siteConfig.name}`,
};

async function FloorsPageLoader() {
  const { floors, stats, access } = await loadFloorsPageData();
  return <FloorsPageContent floors={floors} stats={stats} access={access} />;
}

export default function FloorsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading floors…</div>}>
      <FloorsPageLoader />
    </Suspense>
  );
}
