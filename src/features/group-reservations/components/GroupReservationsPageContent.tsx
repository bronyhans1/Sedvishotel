"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UsersRound } from "lucide-react";

import { GroupReservationFilters } from "@/components/group-reservations/GroupReservationFilters";
import { GroupReservationTable } from "@/components/group-reservations/GroupReservationTable";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import {
  filterGroups,
  type GroupFilterState,
} from "@/features/group-reservations/lib/filter-groups";
import type { GroupListItem } from "@/features/group-reservations/load-group-pages";
import type { GroupReservationAccess } from "@/lib/auth/group-reservation-access";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import type { CorporateAccount } from "@/types/corporate-account";

const defaultFilters: GroupFilterState = {
  search: "",
  status: "all",
  groupType: "all",
  arrivalFrom: "",
  arrivalTo: "",
  departureFrom: "",
  departureTo: "",
  company: "",
};

type Props = {
  groups: GroupListItem[];
  access: GroupReservationAccess;
  corporateAccounts: CorporateAccount[];
};

export function GroupReservationsPageContent({
  groups,
  access,
  corporateAccounts,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useState<GroupFilterState>(defaultFilters);

  const filtered = useMemo(() => filterGroups(groups, filters), [groups, filters]);

  const stats = useMemo(() => {
    const inHouse = groups.filter(
      (g) => g.status === "in_house" || g.status === "partially_checked_in"
    ).length;
    const arriving = groups.filter((g) => g.status === "confirmed").length;
    const outstanding = groups.reduce((s, g) => s + g.outstandingBalance, 0);
    return { total: groups.length, inHouse, arriving, outstanding };
  }, [groups]);

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.groupType !== "all" ||
    filters.company !== "" ||
    filters.arrivalFrom !== "" ||
    filters.arrivalTo !== "" ||
    filters.departureFrom !== "" ||
    filters.departureTo !== "";

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <PageContainer
      title="Group Reservations"
      description={`Manage group bookings and corporate blocks at ${siteConfig.name}.`}
      actions={
        <button
          type="button"
          onClick={refresh}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {filtered.length} of {groups.length} shown · Refresh
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Groups" value={stats.total} icon={UsersRound} />
        <StatCard
          title="In House"
          value={stats.inHouse}
          icon={UsersRound}
          iconClassName="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          title="Confirmed"
          value={stats.arriving}
          icon={UsersRound}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(stats.outstanding)}
          icon={UsersRound}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
      </div>

      <GroupReservationFilters
        filters={filters}
        onFiltersChange={setFilters}
        corporateAccounts={corporateAccounts}
        canCreate={access.canCreate}
        onClear={hasActiveFilters ? () => setFilters(defaultFilters) : undefined}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UsersRound className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">
              {groups.length === 0 ? "No group reservations yet" : "No matching groups"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {groups.length === 0
                ? "Create your first group booking to manage blocks, master folios, and bulk operations."
                : "Try adjusting your search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <GroupReservationTable groups={filtered} canEdit={access.canEdit} />
      )}
    </PageContainer>
  );
}
