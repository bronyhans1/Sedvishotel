"use client";

import { useSearchParams } from "next/navigation";

import { CorporateAccountEditForm } from "@/features/corporate-accounts/components/CorporateAccountEditForm";
import { CorporateExecutiveDashboard } from "@/features/corporate-accounts/components/CorporateExecutiveDashboard";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { isCorporateEditMode } from "@/lib/corporate/edit-mode";
import { siteConfig } from "@/config/site";
import type { loadCorporateDetailPageData } from "@/features/corporate-accounts/load-corporate-pages";

type Props = {
  data: Awaited<ReturnType<typeof loadCorporateDetailPageData>>;
};

export function CorporateAccountDetailContent({ data }: Props) {
  const { account, access, intelligence } = data;
  const searchParams = useSearchParams();
  const editing = isCorporateEditMode(searchParams.get("edit") ?? undefined, access.canEdit);

  return (
    <PageContainer
      title={editing ? `Edit ${account.companyName}` : account.companyName}
      description={`${account.accountNumber} · Corporate account · ${siteConfig.name}`}
      actions={
        access.canEdit && !editing ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/corporate-accounts/${account.id}?edit=1`}>Edit</Link>
          </Button>
        ) : undefined
      }
    >
      {editing ? (
        <CorporateAccountEditForm account={account} />
      ) : (
        <CorporateExecutiveDashboard data={intelligence} />
      )}
    </PageContainer>
  );
}
