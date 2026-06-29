import type { Metadata } from "next";
import { Suspense } from "react";

import { GuestsPageContent } from "@/features/guests/components/GuestsPageContent";
import { GuestsPageSkeleton } from "@/features/guests/components/GuestsPageSkeleton";
import { loadGuestsPageData } from "@/features/guests/load-guests-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Guests",
  description: `Guest management for ${siteConfig.name}`,
};

async function GuestsPageLoader() {
  const { guests, stats, access } = await loadGuestsPageData();
  return (
    <GuestsPageContent guests={guests} stats={stats} access={access} />
  );
}

export default function GuestsPage() {
  return (
    <Suspense fallback={<GuestsPageSkeleton />}>
      <GuestsPageLoader />
    </Suspense>
  );
}
