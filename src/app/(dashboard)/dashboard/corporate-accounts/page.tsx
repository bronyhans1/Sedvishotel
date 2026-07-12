import type { Metadata } from "next";
import { Suspense } from "react";

import { CorporateAccountsPageContent } from "@/features/corporate-accounts/components/CorporateAccountsPageContent";
import { loadCorporateAccountsPageData } from "@/features/corporate-accounts/load-corporate-pages";

export const metadata: Metadata = {
  title: "Corporate Accounts",
};

async function CorporateLoader() {
  const data = await loadCorporateAccountsPageData();
  return (
    <CorporateAccountsPageContent accounts={data.accounts} access={data.access} />
  );
}

export default function CorporateAccountsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading accounts…</div>}>
      <CorporateLoader />
    </Suspense>
  );
}
