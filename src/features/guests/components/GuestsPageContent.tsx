"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { EditGuestModal } from "@/components/guests/EditGuestModal";
import { GuestEmptyState } from "@/components/guests/GuestEmptyState";
import { GuestTable } from "@/components/guests/GuestTable";
import { PageContainer } from "@/components/shared/PageContainer";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { GuestsStats } from "@/features/guests/components/GuestsStats";
import { buildGuestListQuery } from "@/features/guests/lib/parse-guest-search-params";
import type { GuestAccess } from "@/lib/auth/guest-access.types";
import type { GuestListFilters } from "@/lib/guests/list-order";
import { buildPageHref } from "@/lib/pagination/pagination";
import { siteConfig } from "@/config/site";
import { GUEST_STATUS_OPTIONS, type Guest, type GuestStats, type GuestStatus } from "@/types/guest";

const selectClass =
  "h-9 w-full min-w-[140px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto";

const defaultFilters: GuestListFilters = {
  search: "",
  status: "all",
};

type GuestsPageContentProps = {
  guests: Guest[];
  total: number;
  page: number;
  pageSize: number;
  filters: GuestListFilters;
  stats: GuestStats;
  access: GuestAccess;
};

export function GuestsPageContent({
  guests,
  total,
  page,
  pageSize,
  filters,
  stats,
  access,
}: GuestsPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(filters.search);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);

  useEffect(() => {
    setSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (search.trim() === filters.search.trim()) return;
    const handle = window.setTimeout(() => {
      const query = buildGuestListQuery({ ...filters, search }, 1);
      startTransition(() => {
        router.push(query ? `/dashboard/guests?${query}` : "/dashboard/guests");
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [search, filters, router]);

  function pushFilters(next: GuestListFilters, nextPage = 1) {
    const query = buildGuestListQuery(next, nextPage);
    startTransition(() => {
      router.push(query ? `/dashboard/guests?${query}` : "/dashboard/guests");
    });
  }

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  function goToPage(nextPage: number) {
    startTransition(() => {
      router.push(buildPageHref("/dashboard/guests", searchParams.toString(), nextPage));
    });
  }

  const hasActiveFilters = filters.search.trim() !== "" || filters.status !== "all";
  const emptyVariant =
    stats.totalGuests === 0 ? "no-guests" : hasActiveFilters ? "no-results" : "no-guests";

  return (
    <PageContainer
      title="Guests"
      description={`Guest directory for ${siteConfig.name}.`}
      actions={
        <p className="text-xs text-muted-foreground">
          {total} of {stats.totalGuests} guests
        </p>
      }
    >
      <GuestsStats stats={stats} />
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) =>
            pushFilters(
              { ...filters, search, status: e.target.value as GuestStatus | "all" },
              1
            )
          }
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          {GUEST_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {total === 0 ? (
        <GuestEmptyState
          variant={emptyVariant}
          onClearFilters={
            hasActiveFilters
              ? () => {
                  setSearch("");
                  pushFilters(defaultFilters, 1);
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <GuestTable
            guests={guests}
            canEdit={access.canEdit}
            onEdit={access.canEdit ? setEditGuest : undefined}
          />
          {total > pageSize ? (
            <Pagination
              page={page}
              total={total}
              pageSize={pageSize}
              itemLabel="guests"
              onPageChange={goToPage}
            />
          ) : null}
        </div>
      )}
      {access.canEdit && (
        <EditGuestModal
          guest={editGuest}
          open={!!editGuest}
          onOpenChange={(open) => !open && setEditGuest(null)}
          onSuccess={refresh}
        />
      )}
    </PageContainer>
  );
}
