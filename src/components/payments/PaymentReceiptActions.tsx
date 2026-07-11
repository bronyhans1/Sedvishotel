"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Printer, Receipt } from "lucide-react";

import { useBranding } from "@/components/branding/BrandingProvider";
import { Button } from "@/components/ui/button";
import { logReceiptPrintAction } from "@/features/payments/actions";
import { buildReceiptBrandingFromPartial } from "@/lib/receipt/build-receipt-branding";
import { printTransactionReceipt } from "@/lib/payments/print-receipt";
import type { ReceiptBranding } from "@/lib/receipt/receipt-core";
import type { Payment, PaymentTimelineEntry } from "@/types/payment";

type Props = {
  payment: Payment;
  receiptBranding: ReceiptBranding;
  entry?: PaymentTimelineEntry;
  variant?: "button" | "icon";
  size?: "default" | "sm";
  showViewLink?: boolean;
};

function getLatestPrintableEntry(
  payment: Payment,
  entry?: PaymentTimelineEntry
): PaymentTimelineEntry | null {
  if (entry?.kind === "payment" && entry.receiptNumber) {
    return entry;
  }

  return (
    [...payment.timeline]
      .reverse()
      .find((item) => item.kind === "payment" && item.receiptNumber) ?? null
  );
}

export function PaymentReceiptActions({
  payment,
  receiptBranding,
  entry,
  variant = "button",
  size = "sm",
  showViewLink = false,
}: Props) {
  const branding = useBranding();
  const printableEntry = useMemo(
    () => getLatestPrintableEntry(payment, entry),
    [payment, entry]
  );

  const mergedBranding = useMemo(
    () =>
      buildReceiptBrandingFromPartial(
        {
          hotelName: branding?.hotelName,
          logoUrl: branding?.logoUrl,
          primaryColor: branding?.primaryColor,
        },
        receiptBranding
      ),
    [branding, receiptBranding]
  );

  if (!printableEntry?.receiptNumber) {
    return null;
  }

  async function handlePrint() {
    if (!printableEntry) return;
    const result = await logReceiptPrintAction(printableEntry.id);
    const printCount = result.success
      ? result.printCount
      : Math.max(1, (printableEntry.printCount ?? 0) + 1);
    printTransactionReceipt(payment, printableEntry, mergedBranding, printCount);
  }

  const printButton =
    variant === "icon" ? (
      <Button variant="ghost" size={size} onClick={handlePrint} title="Print Receipt">
        <Receipt className="h-4 w-4" />
      </Button>
    ) : (
      <Button variant="outline" size={size} onClick={handlePrint}>
        <Printer className="h-4 w-4" />
        Print Receipt
      </Button>
    );

  if (!showViewLink) {
    return printButton;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {printButton}
      <Button variant="ghost" size={size} asChild>
        <Link href={`/dashboard/payments/${payment.id}`}>View Payment</Link>
      </Button>
    </div>
  );
}
