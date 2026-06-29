"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Printer, Search, ShoppingCart } from "lucide-react";

import { useBranding } from "@/components/branding/BrandingProvider";
import { ProductCategoryPagination } from "@/components/product-categories/ProductCategoryPagination";
import { PageContainer } from "@/components/shared/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPosSaleAction,
  logPosReceiptReprintedAction,
} from "@/features/pos/actions";
import { useToast } from "@/hooks/use-toast";
import type { PosAccess } from "@/lib/auth/pos-access.types";
import { printPosReceipt } from "@/lib/pos/print-pos-receipt";
import { formatCurrency } from "@/lib/utils";
import {
  POS_CUSTOMER_TYPE_OPTIONS,
  POS_PAYMENT_METHOD_OPTIONS,
} from "@/types/pos";
import type { PosSaleHistoryItem } from "@/types/pos";

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type PosHistoryFilters = {
  search: string;
  customerType: string;
  paymentMethod: string;
  cashierId: string;
  dateFrom: string;
  dateTo: string;
};

type PosHistoryPageContentProps = {
  sales: PosSaleHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  cashiers: Array<{ id: string; fullName: string }>;
  access: PosAccess;
  filters: PosHistoryFilters;
};

function formatSaleDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusVariant(status: PosSaleHistoryItem["paymentStatus"]) {
  if (status === "paid") return "default" as const;
  if (status === "pending") return "secondary" as const;
  return "outline" as const;
}

export function PosHistoryPageContent({
  sales,
  total,
  page,
  pageSize,
  cashiers,
  filters,
}: PosHistoryPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const branding = useBranding();
  const [, startTransition] = useTransition();
  const [reprintingId, setReprintingId] = useState<string | null>(null);

  const [search, setSearch] = useState(filters.search);
  const [customerType, setCustomerType] = useState(filters.customerType);
  const [paymentMethod, setPaymentMethod] = useState(filters.paymentMethod);
  const [cashierId, setCashierId] = useState(filters.cashierId);
  const [dateFrom, setDateFrom] = useState(filters.dateFrom);
  const [dateTo, setDateTo] = useState(filters.dateTo);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const applyFilters = useCallback(
    (nextPage = 1) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(nextPage));

      if (search.trim()) params.set("search", search.trim());
      else params.delete("search");

      if (customerType !== "all") params.set("customerType", customerType);
      else params.delete("customerType");

      if (paymentMethod !== "all") params.set("paymentMethod", paymentMethod);
      else params.delete("paymentMethod");

      if (cashierId) params.set("cashierId", cashierId);
      else params.delete("cashierId");

      if (dateFrom) params.set("dateFrom", dateFrom);
      else params.delete("dateFrom");

      if (dateTo) params.set("dateTo", dateTo);
      else params.delete("dateTo");

      startTransition(() => {
        router.push(`/dashboard/pos/history?${params.toString()}`);
      });
    },
    [
      cashierId,
      customerType,
      dateFrom,
      dateTo,
      paymentMethod,
      router,
      search,
      searchParams,
    ]
  );

  async function handleReprint(saleId: string) {
    setReprintingId(saleId);
    try {
      const result = await getPosSaleAction(saleId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      printPosReceipt(result.sale, {
        hotelName: branding?.hotelName,
        logoUrl: branding?.logoUrl,
        primaryColor: branding?.primaryColor,
      });

      const logResult = await logPosReceiptReprintedAction(saleId);
      if (!logResult.success) {
        toast.error(logResult.error);
        return;
      }

      toast.success("Receipt sent to printer.");
    } finally {
      setReprintingId(null);
    }
  }

  return (
    <PageContainer
      title="POS Sales History"
      description="Read-only record of completed retail sales and room charges."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/pos">
            <ShoppingCart className="h-4 w-4" />
            Open POS
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters(1);
            }}
            placeholder="Sale number, receipt, guest, room, cashier…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            className={selectClass}
            aria-label="Filter by sale type"
          >
            <option value="all">All sale types</option>
            {POS_CUSTOMER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className={selectClass}
            aria-label="Filter by payment method"
          >
            <option value="all">All payment methods</option>
            {POS_PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={cashierId}
            onChange={(e) => setCashierId(e.target.value)}
            className={selectClass}
            aria-label="Filter by cashier"
          >
            <option value="">All cashiers</option>
            {cashiers.map((cashier) => (
              <option key={cashier.id} value={cashier.id}>
                {cashier.fullName}
              </option>
            ))}
          </select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-auto"
            aria-label="From date"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-auto"
            aria-label="To date"
          />

          <Button type="button" size="sm" onClick={() => applyFilters(1)}>
            Apply
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 font-semibold">Sale #</th>
                <th className="px-4 py-3 font-semibold">Date & Time</th>
                <th className="px-4 py-3 font-semibold">Cashier</th>
                <th className="px-4 py-3 font-semibold">Sale Type</th>
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Room</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{sale.saleNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatSaleDate(sale.createdAt)}
                  </td>
                  <td className="px-4 py-3">{sale.cashierName ?? "—"}</td>
                  <td className="px-4 py-3">{sale.saleTypeLabel}</td>
                  <td className="px-4 py-3">{sale.guestName ?? "—"}</td>
                  <td className="px-4 py-3">{sale.roomNumber ?? "—"}</td>
                  <td className="px-4 py-3">{sale.paymentMethodLabel}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(sale.paymentStatus)}>
                      {sale.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={reprintingId === sale.id}
                      onClick={() => handleReprint(sale.id)}
                    >
                      <Printer className="h-4 w-4" />
                      Reprint
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!sales.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No sales match your filters.
          </p>
        ) : null}
      </div>

      <ProductCategoryPagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        itemLabel="sales"
        onPageChange={(nextPage) => applyFilters(nextPage)}
      />
    </PageContainer>
  );
}
