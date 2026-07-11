"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";

import { PaymentMethodLabel } from "@/components/payments/PaymentMethodLabel";
import { PaymentReceiptActions } from "@/components/payments/PaymentReceiptActions";
import { InvoicePrintPreview } from "@/components/invoices/InvoicePrintPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ReceiptBranding } from "@/lib/receipt/receipt-core";
import type { Invoice } from "@/types/invoice";
import type { Payment } from "@/types/payment";
import type { HotelSettings } from "@/types/settings";

type DocumentSettings = Pick<
  HotelSettings,
  | "address"
  | "phone"
  | "email"
  | "website"
  | "tinNumber"
  | "taxRate"
  | "invoiceFooter"
  | "termsAndConditions"
>;

export function InvoiceDetailsContent({
  invoice,
  documentSettings,
  payment,
  receiptBranding,
}: {
  invoice: Invoice;
  documentSettings?: DocumentSettings;
  payment?: Payment | null;
  receiptBranding?: ReceiptBranding;
}) {
  const searchParams = useSearchParams();
  const showPrint = searchParams.get("print") === "1";

  if (showPrint) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
          <Button variant="outline" asChild><Link href={`/dashboard/invoices/${invoice.id}`}>Back to details</Link></Button>
        </div>
        <InvoicePrintPreview invoice={invoice} documentSettings={documentSettings} />
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

      <InvoicePrintPreview
        invoice={invoice}
        documentSettings={documentSettings}
        className="print:hidden"
      />

      <div className="grid gap-6 lg:grid-cols-2 print:hidden">
        <Card>
          <CardHeader><CardTitle>Related Records</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Guest: </span>
              <Link
                href={`/dashboard/guests/${invoice.guestId}`}
                className="font-medium text-primary hover:underline"
              >
                {invoice.guestName}
              </Link>
            </p>
            <p>
              <span className="text-muted-foreground">Reservation: </span>
              <Link
                href={`/dashboard/reservations/${invoice.reservationId}`}
                className="font-medium text-primary hover:underline"
              >
                {invoice.reservationNumber}
              </Link>
            </p>
            <p>
              <span className="text-muted-foreground">Room: </span>
              {invoice.roomNumber} · {invoice.roomTypeName}
            </p>
            <p>
              <span className="text-muted-foreground">Status: </span>
              <span className="capitalize">{invoice.status}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Outstanding: </span>
              {formatCurrency(invoice.balance)}
            </p>
          </CardContent>
        </Card>
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

      {payment ? (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Payment Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Invoice amount: </span>
                {formatCurrency(invoice.totalAmount)}
              </p>
              <p>
                <span className="text-muted-foreground">Payments received: </span>
                {formatCurrency(payment.netPaid)}
              </p>
              <p>
                <span className="text-muted-foreground">Outstanding: </span>
                {formatCurrency(invoice.balance)}
              </p>
              <p>
                <span className="text-muted-foreground">Payment status: </span>
                <span className="capitalize">{payment.status.replace(/_/g, " ")}</span>
              </p>
            </div>
            <div className="space-y-3">
              {payment.timeline
                .filter((entry) => entry.kind === "payment")
                .map((entry) => (
                  <div key={entry.id} className="rounded-lg border p-3">
                    <p className="font-medium">
                      {formatCurrency(entry.amount)} ·{" "}
                      <PaymentMethodLabel method={entry.method} />
                    </p>
                    <p className="text-muted-foreground">
                      {entry.displayDate} {entry.time}
                    </p>
                    {entry.receiptNumber ? (
                      <p>
                        <span className="text-muted-foreground">Receipt: </span>
                        <span className="font-mono">{entry.receiptNumber}</span>
                      </p>
                    ) : null}
                    <p>
                      <span className="text-muted-foreground">Reference: </span>
                      {entry.reference}
                    </p>
                    {receiptBranding ? (
                      <div className="mt-2">
                        <PaymentReceiptActions
                          payment={payment}
                          receiptBranding={receiptBranding}
                          entry={entry}
                          size="sm"
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/payments/${payment.id}`}>Open Payment Record</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
