"use client";

import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { EditGuestModal } from "@/components/guests/EditGuestModal";
import { GuestEmptyState } from "@/components/guests/GuestEmptyState";
import { GuestTable } from "@/components/guests/GuestTable";
import { PageContainer } from "@/components/shared/PageContainer";
import { Input } from "@/components/ui/input";
import { GuestsStats } from "@/features/guests/components/GuestsStats";
import { filterGuests } from "@/features/guests/lib/filter-guests";
import type { GuestAccess } from "@/lib/auth/guest-access.types";
import { siteConfig } from "@/config/site";
import { GUEST_STATUS_OPTIONS, type Guest, type GuestStats, type GuestStatus } from "@/types/guest";

const selectClass =
  "h-9 w-full min-w-[140px] rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-auto";

type GuestsPageContentProps = {
  guests: Guest[];
  stats: GuestStats;
  access: GuestAccess;
};

export function GuestsPageContent({
  guests,
  stats,
  access,
}: GuestsPageContentProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<GuestStatus | "all">("all");
  const [editGuest, setEditGuest] = useState<Guest | null>(null);

  const filtered = useMemo(
    () => filterGuests(guests, search, status),
    [guests, search, status]
  );

  const hasActiveFilters = search.trim() !== "" || status !== "all";

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  function clearFilters() {
    setSearch("");
    setStatus("all");
  }

  const emptyVariant =
    guests.length === 0
      ? "no-guests"
      : hasActiveFilters
        ? "no-results"
        : "no-guests";

  return (
    <PageContainer
      title="Guests"
      description={`Guest directory for ${siteConfig.name}.`}
      actions={
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {guests.length} guests
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
          value={status}
          onChange={(e) => setStatus(e.target.value as GuestStatus | "all")}
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
      {filtered.length === 0 ? (
        <GuestEmptyState
          variant={emptyVariant}
          onClearFilters={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <GuestTable
          guests={filtered}
          canEdit={access.canEdit}
          onEdit={access.canEdit ? setEditGuest : undefined}
        />
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
