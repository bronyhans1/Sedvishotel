"use client";

import Link from "next/link";
import { Download, Eye, Printer } from "lucide-react";

import { InvoiceEmptyState } from "@/components/invoices/InvoiceEmptyState";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import type { InvoiceAccess } from "@/lib/auth/invoice-access.types";
import { formatCurrency } from "@/lib/utils";
import { formatInvoiceStatusLabel } from "@/lib/labels/humanize";
import { siteConfig } from "@/config/site";
import { FileText, CheckCircle, AlertCircle, BarChart3 } from "lucide-react";
import type { Invoice, InvoiceStats } from "@/types/invoice";

type InvoicesPageContentProps = {
  invoices: Invoice[];
  stats: InvoiceStats;
  access: InvoiceAccess;
};

export function InvoicesPageContent({
  invoices,
  stats,
}: InvoicesPageContentProps) {
  return (
    <PageContainer title="Invoices" description={`Billing documents for ${siteConfig.name}.`}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Invoices Generated" value={stats.generated} icon={FileText} />
        <StatCard title="Invoices Paid" value={stats.paid} icon={CheckCircle} iconClassName="bg-emerald-500/10 text-emerald-600" />
        <StatCard title="Outstanding Invoices" value={stats.outstanding} icon={AlertCircle} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Average Invoice Value" value={formatCurrency(stats.averageValue)} icon={BarChart3} />
      </div>

      {invoices.length === 0 ? (
        <InvoiceEmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-semibold">Invoice #</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Reservation</th>
                  <th className="px-4 py-3 font-semibold">Room</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Balance</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-medium">{inv.guestName}</td>
                    <td className="hidden px-4 py-3 md:table-cell text-xs">{inv.reservationNumber}</td>
                    <td className="px-4 py-3 font-mono">{inv.roomNumber}</td>
                    <td className="px-4 py-3">{inv.invoiceDate}</td>
                    <td className="px-4 py-3">{formatCurrency(inv.totalAmount)}</td>
                    <td className="px-4 py-3">{formatCurrency(inv.balance)}</td>
                    <td className="px-4 py-3">{formatInvoiceStatusLabel(inv.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/invoices/${inv.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/invoices/${inv.id}?print=1`}><Printer className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="sm" disabled><Download className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
