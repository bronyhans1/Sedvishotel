"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Pencil, Plus } from "lucide-react";

import { PaymentEmptyState } from "@/components/payments/PaymentEmptyState";
import { PaymentMethodLabel } from "@/components/payments/PaymentMethodLabel";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentReceiptActions } from "@/components/payments/PaymentReceiptActions";
import { RecordPaymentModal } from "@/components/payments/RecordPaymentModal";
import { PageContainer } from "@/components/shared/PageContainer";
import { Pagination } from "@/components/shared/Pagination";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import type { PaymentRecordOption } from "@/features/payments/load-payments-page";
import type { PaymentAccess } from "@/lib/auth/payment-access.types";
import type { ReceiptBranding } from "@/lib/receipt/receipt-core";
import { buildPageHref, resetPageParam } from "@/lib/pagination/pagination";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import {
  CircleDollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Wallet,
} from "lucide-react";
import type { Payment, PaymentStats } from "@/types/payment";

type PaymentsPageContentProps = {
  payments: Payment[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  stats: PaymentStats;
  access: PaymentAccess;
  recordOptions: PaymentRecordOption;
  receiptBranding: ReceiptBranding;
  businessDate: string;
};

export function PaymentsPageContent({
  payments,
  total,
  page,
  pageSize,
  search,
  stats,
  access,
  recordOptions,
  receiptBranding,
  businessDate,
}: PaymentsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recordOpen, setRecordOpen] = useState(false);
  const [draft, setDraft] = useState(search);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setDraft(search);
  }, [search]);

  useEffect(() => {
    if (draft.trim() === search.trim()) return;

    const handle = window.setTimeout(() => {
      const params = resetPageParam(new URLSearchParams(searchParams.toString()));
      const nextSearch = draft.trim();
      if (nextSearch) params.set("search", nextSearch);
      else params.delete("search");
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `/dashboard/payments?${query}` : "/dashboard/payments");
      });
    }, 400);

    return () => window.clearTimeout(handle);
  }, [draft, router, search, searchParams]);

  function goToPage(nextPage: number) {
    startTransition(() => {
      router.push(
        buildPageHref("/dashboard/payments", searchParams.toString(), nextPage)
      );
    });
  }

  function clearSearch() {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("search");
      params.delete("page");
      const query = params.toString();
      router.push(query ? `/dashboard/payments?${query}` : "/dashboard/payments");
    });
  }

  return (
    <PageContainer
      title="Payments"
      description={`Payment tracking for ${siteConfig.name}.`}
      actions={
        access.canRecord ? (
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        ) : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Payments" value={stats.totalPayments} icon={Wallet} />
        <StatCard title="Revenue Today" value={formatCurrency(stats.revenueToday)} icon={CircleDollarSign} iconClassName="bg-emerald-500/10 text-emerald-600" />
        <StatCard title="Revenue This Week" value={formatCurrency(stats.revenueWeek)} icon={TrendingUp} />
        <StatCard title="Revenue This Month" value={formatCurrency(stats.revenueMonth)} icon={Calendar} />
        <StatCard title="Outstanding Balances" value={formatCurrency(stats.outstandingBalances)} icon={AlertCircle} iconClassName="bg-amber-500/10 text-amber-600" />
        <StatCard title="Refunded Payments" value={stats.refundedPayments} icon={RotateCcw} iconClassName="bg-red-500/10 text-red-600" />
      </div>

      <input
        type="search"
        placeholder="Search reference, guest, reservation..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
      />

      {total === 0 ? (
        <PaymentEmptyState
          variant={stats.totalPayments === 0 ? "no-payments" : "no-results"}
          onClear={search ? clearSearch : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Reservation</th>
                  <th className="px-4 py-3 font-semibold">Room</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Balance</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.reference}</td>
                    <td className="px-4 py-3 font-medium">{p.guestName}</td>
                    <td className="hidden px-4 py-3 md:table-cell text-xs">{p.reservationNumber}</td>
                    <td className="px-4 py-3 font-mono">{p.roomNumber}</td>
                    <td className="px-4 py-3"><PaymentMethodLabel method={p.method} /></td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3">{formatCurrency(p.balance)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                    <td className="hidden px-4 py-3 lg:table-cell text-muted-foreground">{p.paymentDate}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/payments/${p.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="sm" disabled><Pencil className="h-4 w-4" /></Button>
                        <PaymentReceiptActions
                          payment={p}
                          receiptBranding={receiptBranding}
                          variant="icon"
                          size="sm"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > pageSize ? (
            <div className="border-t px-4 py-3">
              <Pagination
                page={page}
                total={total}
                pageSize={pageSize}
                itemLabel="payments"
                onPageChange={goToPage}
              />
            </div>
          ) : null}
        </div>
      )}

      {access.canRecord && (
        <RecordPaymentModal
          open={recordOpen}
          onOpenChange={setRecordOpen}
          guests={recordOptions.guests}
          reservations={recordOptions.reservations}
          partialPayments={recordOptions.partialPayments}
          folioSettlements={recordOptions.folioSettlements}
          defaultTaxRate={recordOptions.defaultTaxRate}
          defaultVatApplied={recordOptions.defaultVatApplied}
          canOverrideVat={access.canOverrideVat}
          receiptBranding={receiptBranding}
          businessDate={businessDate}
        />
      )}
    </PageContainer>
  );
}
