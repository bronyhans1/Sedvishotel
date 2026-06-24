import { Suspense } from "react";
import type { Metadata } from "next";

import { InvoiceDetailsContent } from "@/features/invoices/components/InvoiceDetailsContent";
import { InvoiceDetailsSkeleton } from "@/features/invoices/components/InvoiceDetailsSkeleton";
import { loadInvoiceDetail } from "@/features/invoices/load-invoice-detail";
import { siteConfig } from "@/config/site";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { invoice } = await loadInvoiceDetail(id);
    return {
      title: invoice.invoiceNumber,
      description: `${invoice.guestName} — ${siteConfig.name}`,
    };
  } catch {
    return { title: "Invoice" };
  }
}

async function InvoiceDetailsLoader({ id }: { id: string }) {
  const { invoice } = await loadInvoiceDetail(id);
  return <InvoiceDetailsContent invoice={invoice} />;
}

export default async function InvoiceDetailsPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<InvoiceDetailsSkeleton />}>
      <InvoiceDetailsLoader id={id} />
    </Suspense>
  );
}
