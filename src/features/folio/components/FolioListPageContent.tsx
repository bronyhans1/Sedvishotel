"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { PageContainer } from "@/components/shared/PageContainer";
import { Pagination } from "@/components/shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buildFolioListQuery } from "@/features/folio/lib/parse-folio-search-params";
import type { GuestFolioAccess } from "@/lib/auth/guest-folio-access.types";
import type { FolioListFilters } from "@/lib/folio/list-order";
import { buildPageHref } from "@/lib/pagination/pagination";
import { formatCurrency } from "@/lib/utils";
import type {
  FolioBalanceFilter,
  FolioListItem,
  FolioStatusFilter,
} from "@/types/folio";

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type FolioListPageContentProps = {
  folios: FolioListItem[];
  total: number;
  page: number;
  pageSize: number;
  filters: FolioListFilters;
  access: GuestFolioAccess;
};

export function FolioListPageContent({
  folios,
  total,
  page,
  pageSize,
  filters,
}: FolioListPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.search);

  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (search.trim() === filters.search.trim()) return;
    const handle = window.setTimeout(() => {
      const query = buildFolioListQuery({ ...filters, search }, 1);
      startTransition(() => {
        router.push(query ? `/dashboard/guest-folio?${query}` : "/dashboard/guest-folio");
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [search, filters, router]);

  function pushFilters(next: FolioListFilters) {
    const query = buildFolioListQuery(next, 1);
    startTransition(() => {
      router.push(query ? `/dashboard/guest-folio?${query}` : "/dashboard/guest-folio");
    });
  }

  function goToPage(nextPage: number) {
    startTransition(() => {
      router.push(buildPageHref("/dashboard/guest-folio", searchParams.toString(), nextPage));
    });
  }

  return (
    <PageContainer
      title="Guest Folio"
      description="Unified guest ledger for in-house and historical stays."
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Guest, room, reservation, folio…"
            className="pl-9"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) =>
            pushFilters({
              ...filters,
              search,
              status: e.target.value as FolioStatusFilter,
            })
          }
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filters.balance}
          onChange={(e) =>
            pushFilters({
              ...filters,
              search,
              balance: e.target.value as FolioBalanceFilter,
            })
          }
          className={selectClass}
          aria-label="Filter by balance"
        >
          <option value="all">All balances</option>
          <option value="outstanding">Outstanding</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-semibold">Folio</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Room</th>
                  <th className="px-4 py-3 font-semibold">Reservation</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {folios.map((folio) => (
                  <tr key={folio.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/guest-folio/${folio.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {folio.folioNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{folio.guestName}</td>
                    <td className="px-4 py-3">{folio.roomNumber}</td>
                    <td className="px-4 py-3">{folio.reservationNumber}</td>
                    <td className="px-4 py-3">
                      <Badge variant={folio.status === "open" ? "default" : "secondary"}>
                        {folio.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatCurrency(folio.outstandingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No folios match your search.
            </p>
          ) : null}
        </div>
        {total > pageSize ? (
          <Pagination
            page={page}
            total={total}
            pageSize={pageSize}
            itemLabel="folios"
            onPageChange={goToPage}
          />
        ) : null}
      </div>
    </PageContainer>
  );
}
