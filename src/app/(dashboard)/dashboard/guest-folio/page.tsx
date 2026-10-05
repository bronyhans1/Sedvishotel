import type { Metadata } from "next";
import { Suspense } from "react";

import { FolioListPageContent } from "@/features/folio/components/FolioListPageContent";
import { FolioPageSkeleton } from "@/features/folio/components/FolioPageSkeleton";
import { loadFolioListPageData } from "@/features/folio/load-folio-page";

export const metadata: Metadata = {
  title: "Guest Folio",
  description: "Unified guest ledger",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function FolioListLoader({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadFolioListPageData(params);
  return <FolioListPageContent {...data} />;
}

export default function GuestFolioPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<FolioPageSkeleton />}>
      <FolioListLoader searchParams={searchParams} />
    </Suspense>
  );
}
