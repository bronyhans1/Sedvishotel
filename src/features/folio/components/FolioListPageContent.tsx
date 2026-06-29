"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PageContainer } from "@/components/shared/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { filterFolioList } from "@/lib/folio/filter-folios";
import type { GuestFolioAccess } from "@/lib/auth/guest-folio-access.types";
import type {
  FolioBalanceFilter,
  FolioListItem,
  FolioStatusFilter,
} from "@/types/folio";

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type FolioListPageContentProps = {
  folios: FolioListItem[];
  access: GuestFolioAccess;
};

export function FolioListPageContent({ folios }: FolioListPageContentProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FolioStatusFilter>("all");
  const [balanceFilter, setBalanceFilter] = useState<FolioBalanceFilter>("all");

  const filtered = useMemo(
    () => filterFolioList(folios, search, status, balanceFilter),
    [folios, search, status, balanceFilter]
  );

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
          value={status}
          onChange={(e) => setStatus(e.target.value as FolioStatusFilter)}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={balanceFilter}
          onChange={(e) => setBalanceFilter(e.target.value as FolioBalanceFilter)}
          className={selectClass}
          aria-label="Filter by balance"
        >
          <option value="all">All balances</option>
          <option value="outstanding">Outstanding</option>
          <option value="paid">Paid</option>
        </select>
      </div>

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
              {filtered.map((folio) => (
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
        {!filtered.length ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No folios match your search.
          </p>
        ) : null}
      </div>
    </PageContainer>
  );
}
