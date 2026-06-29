import type { Metadata } from "next";
import { Suspense } from "react";

import { InvoicesPageContent } from "@/features/invoices/components/InvoicesPageContent";
import { InvoicesPageSkeleton } from "@/features/invoices/components/InvoicesPageSkeleton";
import { loadInvoicesPageData } from "@/features/invoices/load-invoices-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Invoices",
  description: `Billing documents for ${siteConfig.name}`,
};

async function InvoicesPageLoader() {
  const data = await loadInvoicesPageData();
  return <InvoicesPageContent {...data} />;
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesPageSkeleton />}>
      <InvoicesPageLoader />
    </Suspense>
  );
}
