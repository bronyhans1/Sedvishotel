import type { Metadata } from "next";
import { Suspense } from "react";

import { NightAuditDetailContent } from "@/features/night-audit/components/NightAuditDetailContent";
import { loadNightAuditDetailData } from "@/features/night-audit/load-night-audit-detail";
import { siteConfig } from "@/config/site";

type PageProps = {
  params: Promise<{ ref: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: `Night Audit — ${decodeURIComponent(ref)}`,
    description: `Night audit snapshot for ${siteConfig.name}`,
  };
}

async function NightAuditDetailLoader({ ref }: { ref: string }) {
  const { audit, access } = await loadNightAuditDetailData(ref);
  return <NightAuditDetailContent audit={audit} access={access} />;
}

export default async function NightAuditDetailPage({ params }: PageProps) {
  const { ref } = await params;
  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">Loading audit details…</div>}
    >
      <NightAuditDetailLoader ref={ref} />
    </Suspense>
  );
}
