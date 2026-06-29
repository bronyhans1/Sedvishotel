import type { Metadata } from "next";
import { Suspense } from "react";

import { PosHistoryPageContent } from "@/features/pos/components/PosHistoryPageContent";
import { PosHistoryPageSkeleton } from "@/features/pos/components/PosHistoryPageSkeleton";
import { loadPosHistoryPageData } from "@/features/pos/load-pos-history-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "POS Sales History",
  description: `Completed retail sales for ${siteConfig.name}`,
};

type PosHistoryPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    customerType?: string;
    paymentMethod?: string;
    cashierId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

async function PosHistoryPageLoader({
  searchParams,
}: {
  searchParams: PosHistoryPageProps["searchParams"];
}) {
  const params = await searchParams;
  const data = await loadPosHistoryPageData(params);
  return <PosHistoryPageContent {...data} />;
}

export default function PosHistoryPage({ searchParams }: PosHistoryPageProps) {
  return (
    <Suspense fallback={<PosHistoryPageSkeleton />}>
      <PosHistoryPageLoader searchParams={searchParams} />
    </Suspense>
  );
}
