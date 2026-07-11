import type { Metadata } from "next";

import { PaymentDetailsContent } from "@/features/payments/components/PaymentDetailsContent";
import { loadPaymentDetail } from "@/features/payments/load-payment-detail";
import { siteConfig } from "@/config/site";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { payment } = await loadPaymentDetail(id);
    return {
      title: payment.reference,
      description: `${payment.guestName} — ${siteConfig.name}`,
    };
  } catch {
    return { title: "Payment Details" };
  }
}

export default async function PaymentDetailsPage({ params }: Props) {
  const { id } = await params;
  const { payment, access, receiptBranding, printHistory } = await loadPaymentDetail(id);
  return (
    <PaymentDetailsContent
      payment={payment}
      access={access}
      receiptBranding={receiptBranding}
      printHistory={printHistory}
    />
  );
}
