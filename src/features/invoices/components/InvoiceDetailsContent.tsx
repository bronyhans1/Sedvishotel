"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";

import { InvoicePrintPreview } from "@/components/invoices/InvoicePrintPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Invoice } from "@/types/invoice";

export function InvoiceDetailsContent({ invoice }: { invoice: Invoice }) {
  const searchParams = useSearchParams();
  const showPrint = searchParams.get("print") === "1";

  if (showPrint) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
          <Button variant="outline" asChild><Link href={`/dashboard/invoices/${invoice.id}`}>Back to details</Link></Button>
        </div>
        <InvoicePrintPreview invoice={invoice} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link href="/dashboard/invoices"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/invoices/${invoice.id}?print=1`}><Printer className="h-4 w-4" /> Print</Link>
          </Button>
          <Button variant="outline" size="sm" disabled><Download className="h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <InvoicePrintPreview invoice={invoice} className="print:hidden" />

      <div className="grid gap-6 lg:grid-cols-2 print:hidden">
        <Card>
          <CardHeader><CardTitle>Charges Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Room rate</span><span>{formatCurrency(invoice.roomRate)}/night</span></div>
            <div className="flex justify-between"><span>Nights</span><span>{invoice.numberOfNights}</span></div>
            <div className="flex justify-between"><span>Room charges</span><span>{formatCurrency(invoice.roomCharges)}</span></div>
            <div className="flex justify-between"><span>Taxes</span><span>{formatCurrency(invoice.taxes)}</span></div>
            <div className="flex justify-between"><span>Additional</span><span>{formatCurrency(invoice.additionalCharges)}</span></div>
            <div className="flex justify-between"><span>Discounts</span><span>-{formatCurrency(invoice.discounts)}</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(invoice.totalAmount)}</span></div>
            <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(invoice.amountPaid)}</span></div>
            <div className="flex justify-between font-semibold"><span>Balance</span><span>{formatCurrency(invoice.balance)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
