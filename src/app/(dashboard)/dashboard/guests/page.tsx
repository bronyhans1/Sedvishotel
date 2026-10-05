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

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function GuestsPageLoader({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadGuestsPageData(params);
  return <GuestsPageContent {...data} />;
}

export default function GuestsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<GuestsPageSkeleton />}>
      <GuestsPageLoader searchParams={searchParams} />
    </Suspense>
  );
}
