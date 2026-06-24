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

async function PaymentsPageLoader() {
  const data = await loadPaymentsPageData();
  return <PaymentsPageContent {...data} />;
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<PaymentsPageSkeleton />}>
      <PaymentsPageLoader />
    </Suspense>
  );
}
