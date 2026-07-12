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

// "ref" is a reserved React prop; the route param must be renamed before
// being passed as a prop, or React treats it as a ref in a Server Component.
async function NightAuditDetailLoader({ auditRef }: { auditRef: string }) {
  const { audit, access } = await loadNightAuditDetailData(auditRef);
  return <NightAuditDetailContent audit={audit} access={access} />;
}

export default async function NightAuditDetailPage({ params }: PageProps) {
  const { ref } = await params;
  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">Loading audit details…</div>}
    >
      <NightAuditDetailLoader auditRef={ref} />
    </Suspense>
  );
}
