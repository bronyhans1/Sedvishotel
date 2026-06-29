import type { Metadata } from "next";
import { Suspense } from "react";

import { FolioDetailPageContent } from "@/features/folio/components/FolioDetailPageContent";
import { FolioPageSkeleton } from "@/features/folio/components/FolioPageSkeleton";
import { loadFolioDetailPageData } from "@/features/folio/load-folio-page";

export const metadata: Metadata = {
  title: "Guest Folio Detail",
};

async function FolioDetailLoader({ folioId }: { folioId: string }) {
  const { folio, access } = await loadFolioDetailPageData(folioId);
  return <FolioDetailPageContent folio={folio} access={access} />;
}

export default async function GuestFolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<FolioPageSkeleton />}>
      <FolioDetailLoader folioId={id} />
    </Suspense>
  );
}
