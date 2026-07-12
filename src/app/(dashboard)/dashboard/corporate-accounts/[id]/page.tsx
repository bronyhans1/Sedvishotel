import type { Metadata } from "next";
import { Suspense } from "react";

import { CorporateAccountDetailContent } from "@/features/corporate-accounts/components/CorporateAccountDetailContent";
import { loadCorporateDetailPageData } from "@/features/corporate-accounts/load-corporate-pages";

export const metadata: Metadata = {
  title: "Corporate Account Detail",
};

async function DetailLoader({ id }: { id: string }) {
  const data = await loadCorporateDetailPageData(id);
  return <CorporateAccountDetailContent data={data} />;
}

export default async function CorporateAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading account…</div>}>
      <DetailLoader id={id} />
    </Suspense>
  );
}
