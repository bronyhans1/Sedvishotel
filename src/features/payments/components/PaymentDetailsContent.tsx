"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Printer, RotateCcw } from "lucide-react";

import { PaymentMethodLabel } from "@/components/payments/PaymentMethodLabel";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { RefundPaymentModal } from "@/components/payments/RefundPaymentModal";
import { useBranding } from "@/components/branding/BrandingProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentAccess } from "@/lib/auth/payment-access.types";
import { formatMethodsUsed } from "@/lib/payments/method-aggregation";
import { printTransactionReceipt } from "@/lib/payments/print-receipt";
import { formatCurrency } from "@/lib/utils";
import type { Payment, PaymentTimelineEntry } from "@/types/payment";

type Props = {
  payment: Payment;
  access: PaymentAccess;
};

function TimelineEntryBlock({
  payment,
  entry,
}: {
  payment: Payment;
  entry: PaymentTimelineEntry;
}) {
  const branding = useBranding();
  const isRefund = entry.kind === "refund";
  const label = isRefund
    ? `Refund #${entry.sequenceNumber}`
    : `Transaction #${entry.sequenceNumber}`;

  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold">{label}</p>
      {!isRefund && entry.receiptNumber && (
        <p>
          <span className="text-muted-foreground">Receipt: </span>
          <span className="font-mono">{entry.receiptNumber}</span>
        </p>
      )}
      <p>
        <span className="text-muted-foreground">Date: </span>
        {entry.displayDate}
      </p>
      <p>
        <span className="text-muted-foreground">Time: </span>
        {entry.time}
      </p>
      <p>
        <span className="text-muted-foreground">Method: </span>
        <PaymentMethodLabel method={entry.method} />
      </p>
      <p className={isRefund ? "text-red-600" : undefined}>
        <span className="text-muted-foreground">Amount: </span>
        {isRefund ? "− " : ""}
        {formatCurrency(Math.abs(entry.amount))}
      </p>
      {isRefund && entry.reason && (
        <p>
          <span className="text-muted-foreground">Reason: </span>
          {entry.reason}
        </p>
      )}
      {!isRefund &&
        entry.description &&
        entry.description !== "Payment recorded" && (
          <p>
            <span className="text-muted-foreground">Notes: </span>
            {entry.description}
          </p>
        )}
      <p>
        <span className="text-muted-foreground">Reference: </span>
        {entry.reference}
      </p>
      {!isRefund && entry.receiptNumber && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1"
          onClick={() =>
            printTransactionReceipt(payment, entry, {
              hotelName: branding?.hotelName,
              logoUrl: branding?.logoUrl,
              primaryColor: branding?.primaryColor,
            })
          }
        >
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
      )}
    </div>
  );
}

export function PaymentDetailsContent({ payment, access }: Props) {
  const [refundOpen, setRefundOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href="/dashboard/payments">
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-2xl font-bold">{payment.reference}</h1>
          <p className="text-muted-foreground">{payment.paymentDate}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PaymentStatusBadge status={payment.status} />
          {access.canRefund && payment.maxRefundable > 0 && (
            <Button size="sm" variant="outline" onClick={() => setRefundOpen(true)}>
              <RotateCcw className="h-4 w-4" />
              Process Refund
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Payment Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Total due: </span>{formatCurrency(payment.totalDue)}</p>
            <p><span className="text-muted-foreground">Total paid: </span>{formatCurrency(payment.totalPaid)}</p>
            {payment.totalRefunded > 0 && (
              <p><span className="text-muted-foreground">Refunded: </span>{formatCurrency(payment.totalRefunded)}</p>
            )}
            <p><span className="text-muted-foreground">Net paid: </span>{formatCurrency(payment.netPaid)}</p>
            <p><span className="text-muted-foreground">Balance: </span>{formatCurrency(payment.balance)}</p>
            <p><span className="text-muted-foreground">Status: </span><PaymentStatusBadge status={payment.status} /></p>
            <p>
              <span className="text-muted-foreground">Method: </span>
              <PaymentMethodLabel method={payment.method} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Guest Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{payment.guestName}</p>
            <Link href={`/dashboard/guests/${payment.guestId}`} className="text-primary hover:underline">View profile</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reservation</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{payment.reservationNumber}</p>
            <p>Room {payment.roomNumber}</p>
            <Link href={`/dashboard/reservations/${payment.reservationId}`} className="text-primary hover:underline">View reservation</Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Methods Used: </span>
            {payment.methodsUsed.length > 0
              ? formatMethodsUsed(payment.methodsUsed)
              : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Transactions: </span>
            {payment.transactionCount}
          </p>
          {payment.refundCount > 0 && (
            <p>
              <span className="text-muted-foreground">Refunds: </span>
              {payment.refundCount}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">First Payment: </span>
            {payment.firstPaymentDate || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Last Payment: </span>
            {payment.lastPaymentDate || "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment Timeline</CardTitle></CardHeader>
        <CardContent>
          {payment.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions recorded.</p>
          ) : (
            <div className="space-y-4">
              {payment.timeline.map((entry, index) => (
                <div key={entry.id}>
                  <TimelineEntryBlock payment={payment} entry={entry} />
                  {index < payment.timeline.length - 1 && (
                    <hr className="my-4 border-border" />
                  )}
                </div>
              ))}

              <hr className="my-4 border-border" />

              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Total Due: </span>{formatCurrency(payment.totalDue)}</p>
                <p><span className="text-muted-foreground">Total Paid: </span>{formatCurrency(payment.totalPaid)}</p>
                {payment.totalRefunded > 0 && (
                  <p><span className="text-muted-foreground">Refunded: </span>{formatCurrency(payment.totalRefunded)}</p>
                )}
                <p><span className="text-muted-foreground">Net Paid: </span>{formatCurrency(payment.netPaid)}</p>
                <p><span className="text-muted-foreground">Balance: </span>{formatCurrency(payment.balance)}</p>
                <p>
                  <span className="text-muted-foreground">Status: </span>
                  <PaymentStatusBadge status={payment.status} />
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {access.canRefund && (
        <RefundPaymentModal
          open={refundOpen}
          onOpenChange={setRefundOpen}
          paymentId={payment.id}
          maxRefundable={payment.maxRefundable}
        />
      )}
    </div>
  );
}
