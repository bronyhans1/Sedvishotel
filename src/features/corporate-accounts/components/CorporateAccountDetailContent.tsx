"use client";

import { CorporateExecutiveDashboard } from "@/features/corporate-accounts/components/CorporateExecutiveDashboard";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import type { loadCorporateDetailPageData } from "@/features/corporate-accounts/load-corporate-pages";

type Props = {
  data: Awaited<ReturnType<typeof loadCorporateDetailPageData>>;
};

export function CorporateAccountDetailContent({ data }: Props) {
  const { account, access, intelligence } = data;

  return (
    <PageContainer
      title={account.companyName}
      description={`${account.accountNumber} · Corporate account · ${siteConfig.name}`}
      actions={
        access.canEdit ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/corporate-accounts/${account.id}?edit=1`}>Edit</Link>
          </Button>
        ) : undefined
      }
    >
      <CorporateExecutiveDashboard data={intelligence} />
    </PageContainer>
  );
}
