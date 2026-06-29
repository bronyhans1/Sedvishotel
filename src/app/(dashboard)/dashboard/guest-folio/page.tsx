import type { Metadata } from "next";
import { Suspense } from "react";

import { FolioListPageContent } from "@/features/folio/components/FolioListPageContent";
import { FolioPageSkeleton } from "@/features/folio/components/FolioPageSkeleton";
import { loadFolioListPageData } from "@/features/folio/load-folio-page";

export const metadata: Metadata = {
  title: "Guest Folio",
  description: "Unified guest ledger",
};

async function FolioListLoader() {
  const { folios, access } = await loadFolioListPageData();
  return <FolioListPageContent folios={folios} access={access} />;
}

export default function GuestFolioPage() {
  return (
    <Suspense fallback={<FolioPageSkeleton />}>
      <FolioListLoader />
    </Suspense>
  );
}
