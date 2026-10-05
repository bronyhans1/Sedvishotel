import type { Metadata } from "next";
import { Suspense } from "react";

import { PaymentsPageContent } from "@/features/payments/components/PaymentsPageContent";
import { PaymentsPageSkeleton } from "@/features/payments/components/PaymentsPageSkeleton";
import { loadPaymentsPageData } from "@/features/payments/load-payments-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Payments",
  description: `Payment tracking for ${siteConfig.name}`,
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function PaymentsPageLoader({ searchParams }: Props) {
  const params = await searchParams;
  const data = await loadPaymentsPageData(params);
  return <PaymentsPageContent {...data} />;
}

export default function PaymentsPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<PaymentsPageSkeleton />}>
      <PaymentsPageLoader searchParams={searchParams} />
    </Suspense>
  );
}
